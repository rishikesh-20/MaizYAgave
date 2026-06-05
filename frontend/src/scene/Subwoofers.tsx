import { useBpmClock } from "./useBpmClock";

interface Props {
  bpm: number;
  enabled: boolean;
  color: string;
}

const POSITIONS = [22, 38, 62, 78]; // percent across the back wall

export function Subwoofers({ bpm, enabled, color }: Props) {
  const phase = useBpmClock(bpm, enabled);
  // 1 + sin(2π·phase)*0.06 → between ~0.94 and ~1.06
  const kick = enabled ? 1 + Math.sin(phase * Math.PI * 2) * 0.06 : 1;

  return (
    <>
      {POSITIONS.map((x) => (
        <div
          key={x}
          className="subwoofer"
          style={{
            left: `${x}%`,
            transform: `translate(-50%, 0) scaleY(${kick})`,
          }}
        >
          <div
            className="subwoofer-cone"
            style={{ boxShadow: enabled ? `inset 0 0 8px ${color}66` : undefined }}
          />
        </div>
      ))}
    </>
  );
}
