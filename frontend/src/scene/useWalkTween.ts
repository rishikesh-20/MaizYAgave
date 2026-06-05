import { useEffect, useRef, useState } from "react";
import type { Persona, Waypoint } from "../djs/personas";

export type Direction = "down" | "left" | "right" | "up";

export interface WalkState {
  x: number;
  y: number;
  direction: Direction;
  isMoving: boolean;
  isArrived: boolean;
}

interface Options {
  /** True = walk outbound to booth; False = walk back home (if started); null = idle at home. */
  active: boolean;
  /** Total outbound walk duration ms (matched to Lyria settle ~5-10s). */
  durationMs?: number;
  /** Fires once per outbound arrival (and not on return). */
  onArrived?: () => void;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function directionFromDelta(dx: number, dy: number): Direction {
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? "right" : "left";
  }
  return dy >= 0 ? "down" : "up";
}

function segmentLengths(path: Waypoint[]): number[] {
  const lens: number[] = [];
  for (let i = 1; i < path.length; i++) {
    const dx = path[i].x - path[i - 1].x;
    const dy = path[i].y - path[i - 1].y;
    lens.push(Math.hypot(dx, dy));
  }
  return lens;
}

/** Tweens a persona along its `walkPath` (outbound) or its reverse (homebound). */
export function useWalkTween(persona: Persona, opts: Options): WalkState {
  const { active, durationMs = 6000, onArrived } = opts;
  const home = persona.walkPath[0];
  const [state, setState] = useState<WalkState>({
    x: home.x,
    y: home.y,
    direction: "down",
    isMoving: false,
    isArrived: false,
  });

  // Track active outbound walk + most recent run id so stale rAFs no-op.
  const runIdRef = useRef(0);
  const arrivedFiredRef = useRef(false);

  useEffect(() => {
    const myRun = ++runIdRef.current;
    const path = active ? persona.walkPath : [...persona.walkPath].reverse();
    arrivedFiredRef.current = false;

    if (path.length < 2) {
      setState((s) => ({ ...s, isMoving: false }));
      return;
    }

    const lens = segmentLengths(path);
    const total = lens.reduce((a, b) => a + b, 0);
    if (total <= 0) {
      setState({ x: path[path.length - 1].x, y: path[path.length - 1].y, direction: "down", isMoving: false, isArrived: active });
      return;
    }

    const cumStart: number[] = [0];
    for (let i = 0; i < lens.length; i++) cumStart.push(cumStart[i] + lens[i]);

    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      if (runIdRef.current !== myRun) return;
      const elapsed = now - start;
      const tNorm = Math.min(1, elapsed / durationMs);
      const distance = total * easeInOutCubic(tNorm);

      // find segment
      let segIdx = 0;
      while (segIdx < lens.length - 1 && distance > cumStart[segIdx + 1]) segIdx++;
      const segStart = path[segIdx];
      const segEnd = path[segIdx + 1];
      const segDistance = distance - cumStart[segIdx];
      const segLen = lens[segIdx];
      const r = segLen > 0 ? segDistance / segLen : 0;

      const x = segStart.x + (segEnd.x - segStart.x) * r;
      const y = segStart.y + (segEnd.y - segStart.y) * r;
      const dx = segEnd.x - segStart.x;
      const dy = segEnd.y - segStart.y;
      const direction = directionFromDelta(dx, dy);

      setState({
        x,
        y,
        direction,
        isMoving: tNorm < 1,
        isArrived: active && tNorm >= 1,
      });

      if (tNorm >= 1) {
        if (active && !arrivedFiredRef.current) {
          arrivedFiredRef.current = true;
          onArrived?.();
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
    };
    // We intentionally omit onArrived from deps — it should fire once per arrival,
    // not re-trigger when the callback identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, persona, durationMs]);

  return state;
}
