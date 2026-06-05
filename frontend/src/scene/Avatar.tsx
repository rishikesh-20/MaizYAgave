import type { Persona } from "../djs/personas";
import { SPRITE_FRAME_PX, useSprite } from "./useSprite";
import type { Direction } from "./useWalkTween";

interface Props {
  persona: Persona;
  x: number; // percent
  y: number; // percent
  direction?: Direction;
  isMoving?: boolean;
  active?: boolean;
  scale?: number;
  bpm?: number;
  showLabel?: boolean;
}

export function Avatar({
  persona,
  x,
  y,
  direction = "down",
  isMoving = false,
  active = false,
  scale = 1,
  bpm,
  showLabel = true,
}: Props) {
  const frame = useSprite(direction, { isMoving, bpm });

  return (
    <div
      className={`avatar2 ${active ? "avatar2--active" : ""}`}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: `translate(-50%, -100%) scale(${scale})`,
        filter: active ? `drop-shadow(0 0 10px ${persona.palette.glow})` : undefined,
      }}
      title={`${persona.name} — ${persona.genre}`}
    >
      <div
        className="avatar2-sprite"
        style={{
          width: SPRITE_FRAME_PX,
          height: SPRITE_FRAME_PX,
          backgroundImage: `url(${persona.spritePath})`,
          backgroundSize: frame.bgSize,
          backgroundPosition: `${frame.bgX}px ${frame.bgY}px`,
        }}
      />
      {showLabel && <div className="avatar2-label">{persona.name}</div>}
    </div>
  );
}
