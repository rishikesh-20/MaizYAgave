import { PcmPlayer } from "../audio/pcmPlayer";

export type ServerState =
  | "connecting"
  | "warming"
  | "playing"
  | "paused"
  | "stopped"
  | "error";

export interface StatusPayload {
  type: "status";
  state: ServerState;
  message?: string;
}

type StatusHandler = (status: StatusPayload) => void;
type CloseHandler = () => void;

function wsUrl(): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws/music`;
}

export class MusicSocket {
  private ws: WebSocket | null = null;
  private player = new PcmPlayer();
  private onStatus: StatusHandler;
  private onClose: CloseHandler;
  private sessionReady = false;

  constructor(onStatus: StatusHandler, onClose: CloseHandler) {
    this.onStatus = onStatus;
    this.onClose = onClose;
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /** Lyria is connected on the server (warm or playing). */
  get hasWarmSession(): boolean {
    return this.sessionReady;
  }

  private dispatchStatus(payload: StatusPayload): void {
    const msg = payload.message ?? "";
    if (msg.includes("Studio ready")) {
      this.sessionReady = true;
    } else if (payload.state === "stopped" || payload.state === "error") {
      this.sessionReady = false;
    }
    this.onStatus(payload);
  }

  connect(): void {
    this.ensureSocket();
  }

  private ensureSocket(): WebSocket {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return this.ws;
    }
    if (this.ws) {
      this.ws.close();
    }
    const socket = new WebSocket(wsUrl());
    socket.binaryType = "arraybuffer";
    this.ws = socket;

    socket.onmessage = (event) => {
      if (typeof event.data === "string") {
        try {
          const payload = JSON.parse(event.data) as StatusPayload;
          if (payload.type === "status") {
            this.dispatchStatus(payload);
          }
        } catch {
          /* ignore */
        }
        return;
      }
      if (event.data instanceof ArrayBuffer) {
        this.player.enqueue(event.data);
      }
    };

    socket.onclose = () => {
      this.sessionReady = false;
      void this.player.reset();
      this.onClose();
    };

    socket.onerror = () => {
      this.dispatchStatus({
        type: "status",
        state: "error",
        message: "WebSocket connection failed.",
      });
    };

    return socket;
  }

  private sendWhenOpen(
    payload: object,
    afterOpen?: () => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = this.ensureSocket();
      const send = () => {
        socket.send(JSON.stringify(payload));
        afterOpen?.();
        resolve();
      };
      if (socket.readyState === WebSocket.OPEN) {
        send();
        return;
      }
      socket.addEventListener("open", () => send(), { once: true });
      socket.addEventListener("error", () => reject(new Error("WS failed")), {
        once: true,
      });
    });
  }

  async warm(): Promise<void> {
    await this.sendWhenOpen({ type: "warm" });
  }

  async start(prompt: string): Promise<void> {
    await this.player.ensureContext();
    await this.sendWhenOpen({ type: "start", prompt });
  }

  async steer(prompt: string): Promise<void> {
    await this.player.ensureContext();
    await this.sendWhenOpen({ type: "steer", prompt });
  }

  async stop(): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      await this.player.reset();
      this.sessionReady = false;
      return;
    }
    await this.sendWhenOpen({ type: "stop" });
    this.sessionReady = false;
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.sessionReady = false;
    void this.player.reset();
  }
}
