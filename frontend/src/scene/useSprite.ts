import { useEffect, useState } from "react";
import type { Direction } from "./useWalkTween";

const FRAME_PX = 32;
const COLS = 4;
// Row layout of the spritesheet: down, left, right, up
const ROW_BY_DIRECTION: Record<Direction, number> = {
  down: 0,
  left: 1,
  right: 2,
  up: 3,
};

export interface SpriteFrame {
  /** background-position-x in px (negative offset). */
  bgX: number;
  /** background-position-y in px (negative offset). */
  bgY: number;
  /** size of the spritesheet bg in px, e.g. "128px 128px". */
  bgSize: string;
}

interface Options {
  isMoving: boolean;
  bpm?: number;
}

/**
 * Steps through the 4-frame walk cycle in the row matching `direction`.
 * When `isMoving` is false, locks to the stand frame (col 0).
 * Step cadence scales with bpm.
 */
export function useSprite(direction: Direction, opts: Options): SpriteFrame {
  const { isMoving, bpm = 120 } = opts;
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!isMoving) {
      setFrame(0);
      return;
    }
    // Cadence: ~ bpm/30 steps per second, clamped (4..10 Hz).
    const stepsPerSec = Math.max(4, Math.min(10, bpm / 30));
    const intervalMs = 1000 / stepsPerSec;
    const id = setInterval(() => {
      setFrame((f) => (f + 1) % COLS);
    }, intervalMs);
    return () => clearInterval(id);
  }, [isMoving, bpm]);

  const row = ROW_BY_DIRECTION[direction];
  return {
    bgX: -frame * FRAME_PX,
    bgY: -row * FRAME_PX,
    bgSize: `${FRAME_PX * COLS}px ${FRAME_PX * COLS}px`,
  };
}

export const SPRITE_FRAME_PX = FRAME_PX;
