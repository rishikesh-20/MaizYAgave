import { useEffect, useRef, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
import {
  CLOUD_WORDS,
  MAX_MOOD_SELECTIONS,
  MIN_MOOD_SELECTIONS,
  getSimilarWords,
  getWordZone,
  getZoneStyle,
  type CloudWord,
} from "../constants/moodWords";

interface WordCloudProps {
  resetKey: number;
  selected: string[];
  onToggle: (word: string) => void;
  onPlay: () => void;
  onStop: () => void;
  isPlaying: boolean;
  isBusy: boolean;
  canPlay: boolean;
  canStop: boolean;
  selectionFull: boolean;
}

const SPAWN_RADIUS = 7.5;

function wordPositionPercent(word: CloudWord): { x: number; y: number } {
  const rad = (word.angle * Math.PI) / 180;
  return {
    x: 50 + Math.cos(rad) * word.radius * 100,
    y: 50 + Math.sin(rad) * word.radius * 100,
  };
}

function wordPosition(word: CloudWord): CSSProperties {
  const { x, y } = wordPositionPercent(word);
  return { left: `${x}%`, top: `${y}%` };
}

function spawnPositionAround(
  anchor: { x: number; y: number },
  index: number,
  total: number
): CSSProperties {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  const x = anchor.x + Math.cos(angle) * SPAWN_RADIUS;
  const y = anchor.y + Math.sin(angle) * SPAWN_RADIUS;
  return { left: `${x}%`, top: `${y}%` };
}

export function WordCloud({
  resetKey,
  selected,
  onToggle,
  onPlay,
  onStop,
  isPlaying,
  isBusy,
  canPlay,
  canStop,
  selectionFull,
}: WordCloudProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [anchorWord, setAnchorWord] = useState<string | null>(null);

  const suggestions = anchorWord ? getSimilarWords(anchorWord) : [];
  const anchorCloudWord = anchorWord
    ? CLOUD_WORDS.find((w) => w.text === anchorWord)
    : null;
  const anchorPoint = anchorCloudWord
    ? wordPositionPercent(anchorCloudWord)
    : null;

  useEffect(() => {
    setAnchorWord(null);
  }, [resetKey]);

  useEffect(() => {
    if (!anchorWord) return;

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest(".cloud-word") ||
        target.closest(".spawned-word") ||
        target.closest(".cloud-play-btn")
      ) {
        return;
      }
      setAnchorWord(null);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [anchorWord]);

  const setAnchor = (text: string) => {
    setAnchorWord((prev) => (prev === text ? null : text));
  };

  const handleWordClick = (word: CloudWord, e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const text = word.text;
    const isSelected = selected.includes(text);

    if (isSelected) {
      onToggle(text);
      if (anchorWord === text) setAnchorWord(null);
      return;
    }

    if (!selectionFull) {
      onToggle(text);
    }

    setAnchor(text);
  };

  const handleSpawnedClick = (text: string, e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const isSelected = selected.includes(text);

    if (isSelected) {
      onToggle(text);
      return;
    }
    if (selectionFull) return;
    onToggle(text);
  };

  const handleCenterClick = () => {
    if (isPlaying || isBusy) {
      if (canStop) onStop();
      return;
    }
    if (canPlay) onPlay();
  };

  const hint =
    selected.length === 0
      ? `Click a mood word · pick ${MIN_MOOD_SELECTIONS}–${MAX_MOOD_SELECTIONS} · then play`
      : selected.length < MIN_MOOD_SELECTIONS
        ? `Select at least ${MIN_MOOD_SELECTIONS} word · ${selected.length} selected`
        : `${selected.length} / ${MAX_MOOD_SELECTIONS} selected`;

  return (
    <div className="word-cloud-stage" ref={stageRef}>
      <div className="word-cloud-nebula" aria-hidden="true">
        {(["joyful", "peaceful", "melancholic", "dreamy", "passionate"] as const).map(
          (zone) => {
            const style = getZoneStyle(zone);
            const mid =
              ((style.startAngle + style.endAngle) / 2) * (Math.PI / 180);
            const x = 50 + Math.cos(mid) * 38;
            const y = 50 + Math.sin(mid) * 38;
            return (
              <div
                key={zone}
                className={`nebula-arc nebula-${zone}`}
                style={
                  {
                    "--arc-x": `${x}%`,
                    "--arc-y": `${y}%`,
                    "--arc-color": style.glow,
                  } as CSSProperties
                }
              />
            );
          }
        )}
      </div>

      {anchorPoint && (
        <div
          className="spawn-ring"
          style={{
            left: `${anchorPoint.x}%`,
            top: `${anchorPoint.y}%`,
          }}
          aria-hidden="true"
        />
      )}

      <div
        className={`word-cloud-words ${anchorWord ? "has-anchor" : ""}`}
      >
        {CLOUD_WORDS.map((word, index) => {
          const zone = getZoneStyle(word.zone);
          const isSelected = selected.includes(word.text);
          const isAnchor = anchorWord === word.text;
          const isSpawnedNearby =
            anchorWord !== null && suggestions.includes(word.text);
          const isDisabled =
            !isSelected &&
            selectionFull &&
            !isAnchor &&
            !isSpawnedNearby;

          return (
            <button
              key={word.text}
              type="button"
              className={[
                "cloud-word",
                `cloud-word-${word.tier}`,
                `cloud-word-zone-${word.zone}`,
                isSelected ? "selected" : "",
                isAnchor ? "anchor" : "",
                isSpawnedNearby ? "dimmed" : "",
                isDisabled ? "disabled" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={
                {
                  ...wordPosition(word),
                  "--word-color": zone.color,
                  "--word-glow": zone.glow,
                  animationDelay: `${(index % 16) * 0.2}s`,
                } as CSSProperties
              }
              disabled={isDisabled}
              onClick={(e) => handleWordClick(word, e)}
              aria-pressed={isSelected}
            >
              {word.text}
            </button>
          );
        })}
      </div>

      {anchorPoint &&
        suggestions.map((text, i) => {
          const zone = getZoneStyle(getWordZone(text));
          const isSelected = selected.includes(text);
          const disabled = !isSelected && selectionFull;

          return (
            <button
              key={`spawn-${anchorWord}-${text}`}
              type="button"
              className={[
                "spawned-word",
                `cloud-word-zone-${zone.id}`,
                isSelected ? "selected" : "",
                disabled ? "disabled" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={
                {
                  ...spawnPositionAround(anchorPoint, i, suggestions.length),
                  "--word-color": zone.color,
                  "--word-glow": zone.glow,
                  animationDelay: `${i * 0.05}s`,
                } as CSSProperties
              }
              disabled={disabled}
              onClick={(e) => handleSpawnedClick(text, e)}
              aria-pressed={isSelected}
            >
              {text}
            </button>
          );
        })}

      <button
        type="button"
        className={`cloud-play-btn ${isBusy ? "busy" : ""} ${isPlaying ? "playing" : ""}`}
        onClick={handleCenterClick}
        disabled={!canPlay && !canStop}
        aria-label={
          isPlaying || isBusy
            ? "Stop playback"
            : canPlay
              ? "Generate music from selected words"
              : `Select ${MIN_MOOD_SELECTIONS} to ${MAX_MOOD_SELECTIONS} words to play`
        }
      >
        <span className="cloud-play-ring" aria-hidden="true" />
        <span className="cloud-play-icon" aria-hidden="true">
          {isBusy ? (
            <span className="cloud-play-spinner" />
          ) : isPlaying ? (
            "■"
          ) : (
            "▶"
          )}
        </span>
      </button>

      <p className="word-cloud-hint">{hint}</p>
    </div>
  );
}
