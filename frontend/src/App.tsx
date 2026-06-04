import { useCallback, useEffect, useRef, useState } from "react";
import {
  MusicSocket,
  type ServerState,
  type StatusPayload,
} from "./api/musicSocket";
import { PromptForm } from "./components/PromptForm";
import { StatusBar } from "./components/StatusBar";
import { TransportControls } from "./components/TransportControls";
import "./App.css";

const DEFAULT_PROMPT = "Minimal techno, driving kick, dark synth pads, 128 BPM";
const STEER_DEBOUNCE_MS = 300;

export default function App() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [state, setState] = useState<ServerState>("stopped");
  const [statusMessage, setStatusMessage] = useState(
    "Ready. Enter a prompt and press Play."
  );
  const [lastSteeredPrompt, setLastSteeredPrompt] = useState("");
  const socketRef = useRef<MusicSocket | null>(null);
  const steerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleStatus = useCallback((payload: StatusPayload) => {
    setState(payload.state);
    if (payload.message) {
      setStatusMessage(payload.message);
    }
  }, []);

  const handleClose = useCallback(() => {
    setState("stopped");
    setStatusMessage("Disconnected from server.");
  }, []);

  useEffect(() => {
    socketRef.current = new MusicSocket(handleStatus, handleClose);
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [handleStatus, handleClose]);

  const promptTrimmed = prompt.trim();
  const isBusy = state === "connecting";
  const isPlaying = state === "playing";
  const isError = state === "error";

  const canPlay =
    !isBusy &&
    !isPlaying &&
    promptTrimmed.length > 0 &&
    (state === "stopped" || isError);
  const canStop = isPlaying || state === "connecting";
  const promptChanged =
    promptTrimmed.length > 0 && promptTrimmed !== lastSteeredPrompt;
  const canSteer = isPlaying && promptChanged && !isBusy;

  const onPlay = async () => {
    try {
      setLastSteeredPrompt(promptTrimmed);
      await socketRef.current?.start(promptTrimmed);
    } catch {
      setState("error");
      setStatusMessage("Failed to start playback.");
    }
  };

  const onStop = async () => {
    try {
      await socketRef.current?.stop();
    } catch {
      setState("error");
      setStatusMessage("Failed to stop playback.");
    }
  };

  const sendSteer = useCallback(async () => {
    if (!promptTrimmed || !socketRef.current) return;
    try {
      await socketRef.current.steer(promptTrimmed);
      setLastSteeredPrompt(promptTrimmed);
    } catch {
      setState("error");
      setStatusMessage("Failed to update sound.");
    }
  }, [promptTrimmed]);

  const onSteer = () => {
    if (steerTimerRef.current) {
      clearTimeout(steerTimerRef.current);
    }
    steerTimerRef.current = setTimeout(() => {
      void sendSteer();
    }, STEER_DEBOUNCE_MS);
  };

  return (
    <main className="app-card">
      <header className="app-header">
        <h1>MaizYAgave</h1>
        <p>Live music with Lyria</p>
      </header>

      <PromptForm
        value={prompt}
        onChange={setPrompt}
        disabled={isBusy}
      />

      <TransportControls
        canPlay={canPlay}
        canStop={canStop}
        canSteer={canSteer}
        onPlay={() => void onPlay()}
        onStop={() => void onStop()}
        onSteer={onSteer}
      />

      <StatusBar state={state} message={statusMessage} />

      <p className="tip">
        Tip: After you update the prompt, the mix may take 5–10 seconds to
        settle into the new style.
      </p>
    </main>
  );
}
