import { useEffect } from "react";
import type { Persona } from "../djs/personas";
import { Avatar } from "./Avatar";
import { useWalkTween } from "./useWalkTween";

interface Props {
  persona: Persona;
  bpm: number;
  walkDurationMs?: number;
  onArrived: () => void;
  onWalkingChange?: (isMoving: boolean) => void;
}

/** Renders the active DJ tweening from their desk to the booth. */
export function WalkingDj({
  persona,
  bpm,
  walkDurationMs = 6000,
  onArrived,
  onWalkingChange,
}: Props) {
  const walk = useWalkTween(persona, {
    active: true,
    durationMs: walkDurationMs,
    onArrived,
  });

  useEffect(() => {
    onWalkingChange?.(walk.isMoving);
  }, [walk.isMoving, onWalkingChange]);

  return (
    <Avatar
      persona={persona}
      x={walk.x}
      y={walk.y}
      direction={walk.direction}
      isMoving={walk.isMoving}
      bpm={bpm}
      active
      scale={walk.isArrived ? 1.18 : 1.05}
      showLabel={false}
    />
  );
}
