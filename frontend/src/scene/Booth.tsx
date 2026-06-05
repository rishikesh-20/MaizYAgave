import type { Persona } from "../djs/personas";

interface Props {
  activeDj: Persona | null;
  bpm?: number;
  isWarming?: boolean;
}

export const BOOTH_POS = { x: 50, y: 44 };

export function Booth({ activeDj, bpm, isWarming }: Props) {
  return (
    <div
      className="booth"
      style={{ left: `${BOOTH_POS.x}%`, top: `${BOOTH_POS.y}%` }}
    >
      <div className="booth-deck">
        <div className="booth-platter" />
        <div className="booth-platter" />
      </div>
      <div className="booth-label">
        {activeDj ? (
          <>
            <span style={{ color: activeDj.palette.glow }}>{activeDj.name}</span>
            <span className="booth-genre"> · {activeDj.genre}</span>
            {typeof bpm === "number" && (
              <span className="booth-bpm"> · {Math.round(bpm)} BPM</span>
            )}
            {isWarming && <span className="booth-warming"> · warming up…</span>}
          </>
        ) : (
          <span className="booth-empty">— booth empty —</span>
        )}
      </div>
    </div>
  );
}
