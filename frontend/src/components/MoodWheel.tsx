import { useMemo, type CSSProperties } from "react";
import type { MoodEntry, MoodSectorId } from "../data/moods";
import { getSectorColor, getSectorGlow } from "../data/moods";
import type { ServerState } from "../api/musicSocket";
import { getHeaderMoods, layoutMoods } from "../utils/moodLayout";
import "./MoodWheel.css";

const POSITIONED_MOODS = layoutMoods();
const HEADER_MOODS = getHeaderMoods();

interface MoodWheelProps {
  selectedMoodId: string | null;
  activeSector: MoodSectorId | null;
  state: ServerState;
  statusMessage: string;
  onSelectMood: (mood: MoodEntry) => void;
  onPlayStop: () => void;
}

export function MoodWheel({
  selectedMoodId,
  activeSector,
  state,
  statusMessage,
  onSelectMood,
  onPlayStop,
}: MoodWheelProps) {
  const isPlaying = state === "playing";
  const isConnecting = state === "connecting";
  const isBusy = isConnecting;
  const isError = state === "error";

  const stars = useMemo(
    () =>
      Array.from({ length: 140 }, (_, i) => ({
        id: i,
        left: `${(i * 17 + 7) % 100}%`,
        top: `${(i * 23 + 11) % 100}%`,
        size: 1 + (i % 3),
        opacity: 0.2 + (i % 5) * 0.12,
        delay: `${(i % 14) * 0.27}s`,
        duration: `${2 + (i % 6) * 0.35}s`,
      })),
    []
  );

  const sectorGlowStyle = activeSector
    ? ({ "--active-glow": getSectorGlow(activeSector) } as CSSProperties)
    : undefined;

  return (
    <div
      className={`mood-wheel-page${isPlaying ? " is-playing" : ""}`}
      style={sectorGlowStyle}
    >
      <div className="cosmic-bg">
        {stars.map((s) => (
          <span
            key={s.id}
            className="star"
            style={{
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              opacity: s.opacity,
              animationDelay: s.delay,
              animationDuration: s.duration,
            }}
          />
        ))}
        <div className="nebula nebula-left" />
        <div className="nebula nebula-right" />
        <div className="light-streak streak-left" />
        <div className="light-streak streak-right" />
      </div>

      <header className="wheel-header">
        <h1>MaizYAgave</h1>
        <p className="wheel-tagline">Choose a mood — the music follows</p>
        <div className="header-mood-row" aria-label="Quick peaceful moods">
          {HEADER_MOODS.map((mood, i) => {
            const isSelected = selectedMoodId === mood.id;
            return (
              <button
                key={mood.id}
                type="button"
                className={`header-mood-chip${isSelected ? " selected" : ""}`}
                style={{
                  ["--chip-color" as string]: getSectorColor(mood.sector),
                  ["--chip-glow" as string]: getSectorGlow(mood.sector),
                  ["--float-delay" as string]: `${i * 0.15}s`,
                }}
                disabled={isBusy}
                onClick={() => onSelectMood(mood)}
                aria-pressed={isSelected}
              >
                {mood.label}
              </button>
            );
          })}
        </div>
      </header>

      <div className="wheel-stage">
        <div className="wheel-ring" aria-hidden />

        {POSITIONED_MOODS.map((mood) => {
          const rad = (mood.angle * Math.PI) / 180;
          const x = 50 + mood.radius * Math.sin(rad);
          const y = 50 - mood.radius * Math.cos(rad);
          const isSelected = selectedMoodId === mood.id;
          const color = getSectorColor(mood.sector);

          return (
            <button
              key={mood.id}
              type="button"
              className={`mood-chip-wrap${isSelected ? " selected" : ""}${mood.primary ? " primary" : ""}`}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                ["--chip-color" as string]: color,
                ["--chip-glow" as string]: getSectorGlow(mood.sector),
                ["--float-delay" as string]: `${mood.animDelay}s`,
                ["--float-duration" as string]: `${2.8 + (mood.animDelay % 1.2)}s`,
              }}
              disabled={isBusy}
              onClick={() => onSelectMood(mood)}
              aria-pressed={isSelected}
              aria-label={`${mood.label} mood`}
            >
              <span
                className="mood-chip"
                style={{ fontSize: `${mood.fontSize}rem` }}
              >
                {mood.label}
              </span>
            </button>
          );
        })}

        <div className="wheel-center-anchor">
          <button
            type="button"
            className={`wheel-center${isPlaying ? " playing" : ""}${isConnecting ? " connecting" : ""}`}
            onClick={onPlayStop}
            disabled={isConnecting}
            aria-label={isPlaying ? "Stop music" : "Play selected mood"}
          >
            <span className="center-glow" aria-hidden />
            <span className="center-ring" aria-hidden />
            <span className="center-icon-slot">
              {isConnecting ? (
                <span className="center-icon spinner" aria-hidden />
              ) : isPlaying ? (
                <span className="center-icon stop-icon" aria-hidden />
              ) : (
                <span className="center-icon play-icon" aria-hidden />
              )}
            </span>
          </button>
        </div>
      </div>

      <footer className="wheel-footer">
        <div className={`wheel-status${isError ? " error" : ""}`}>
          <span className="status-label">
            {isPlaying ? "Now playing" : isConnecting ? "Connecting" : isError ? "Error" : "Ready"}
          </span>
          <span className="status-text">{statusMessage}</span>
        </div>
        <p className="wheel-hint">
          Tap a mood to play or shift the sound. The mix may take 5–10 seconds to settle.
        </p>
      </footer>
    </div>
  );
}
