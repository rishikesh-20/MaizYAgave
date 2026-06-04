interface TransportControlsProps {
  canPlay: boolean;
  canStop: boolean;
  canSteer: boolean;
  onPlay: () => void;
  onStop: () => void;
  onSteer: () => void;
}

export function TransportControls({
  canPlay,
  canStop,
  canSteer,
  onPlay,
  onStop,
  onSteer,
}: TransportControlsProps) {
  return (
    <div className="controls">
      <button
        type="button"
        className="btn-play"
        disabled={!canPlay}
        onClick={onPlay}
      >
        Play
      </button>
      <button
        type="button"
        className="btn-stop"
        disabled={!canStop}
        onClick={onStop}
      >
        Stop
      </button>
      <button
        type="button"
        className="btn-steer"
        disabled={!canSteer}
        onClick={onSteer}
      >
        Update sound
      </button>
    </div>
  );
}
