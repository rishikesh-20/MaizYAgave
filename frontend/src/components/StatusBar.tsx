import type { ServerState } from "../api/musicSocket";

interface StatusBarProps {
  state: ServerState;
  message?: string;
}

const stateLabels: Record<ServerState, string> = {
  connecting: "Connecting",
  playing: "Playing",
  paused: "Paused",
  stopped: "Stopped",
  error: "Error",
};

export function StatusBar({ state, message }: StatusBarProps) {
  const isError = state === "error";
  return (
    <div className={`status-panel${isError ? " error" : ""}`}>
      <p className="status-line">
        <strong>Status:</strong> {stateLabels[state]}
      </p>
      {message && <p className="status-detail">{message}</p>}
    </div>
  );
}
