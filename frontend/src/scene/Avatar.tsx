import type { Persona } from "../djs/personas";

interface Props {
  persona: Persona;
  x: number; // percent
  y: number; // percent
  active?: boolean;
  scale?: number;
}

// Placeholder pixel-style avatar built from divs. Real Itch.io sprites can
// drop in by reading persona.spritePath when added — see persona schema.
export function Avatar({ persona, x, y, active, scale = 1 }: Props) {
  const { body, accent, glow } = persona.palette;
  return (
    <div
      className="avatar"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: `translate(-50%, -50%) scale(${scale})`,
        filter: active ? `drop-shadow(0 0 12px ${glow})` : undefined,
      }}
      title={`${persona.name} — ${persona.genre}`}
    >
      <div className="avatar-head" style={{ background: accent }} />
      <div className="avatar-body" style={{ background: body }}>
        <div className="avatar-belt" style={{ background: accent }} />
      </div>
      <div className="avatar-shadow" />
      <div className="avatar-label">{persona.name}</div>
    </div>
  );
}
