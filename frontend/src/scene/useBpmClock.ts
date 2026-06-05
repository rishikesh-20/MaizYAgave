import { useEffect, useRef, useState } from "react";

/** Returns a phase in [0, 1) that completes one cycle per beat at `bpm`. */
export function useBpmClock(bpm: number, enabled = true): number {
  const [phase, setPhase] = useState(0);
  const startedRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || bpm <= 0) {
      startedRef.current = null;
      setPhase(0);
      return;
    }
    let raf = 0;
    const periodMs = 60_000 / bpm;
    const loop = (t: number) => {
      if (startedRef.current === null) startedRef.current = t;
      const elapsed = t - startedRef.current;
      const p = (elapsed % periodMs) / periodMs;
      setPhase(p);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [bpm, enabled]);

  return phase;
}
