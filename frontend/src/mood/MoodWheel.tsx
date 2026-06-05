import { useMemo, useRef, useState } from "react";
import { WEDGES, pickFromAngle, type WheelPick } from "./wheel";

interface Props {
  onPick: (pick: WheelPick) => void;
  activeWedgeId?: string | null;
  disabled?: boolean;
}

const SIZE = 280;
const R = SIZE / 2;
const INNER = 48;

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function wedgePath(startDeg: number, endDeg: number): string {
  const outerStart = polar(R, R, R - 4, startDeg);
  const outerEnd = polar(R, R, R - 4, endDeg);
  const innerStart = polar(R, R, INNER, startDeg);
  const innerEnd = polar(R, R, INNER, endDeg);
  return [
    `M ${innerStart.x} ${innerStart.y}`,
    `L ${outerStart.x} ${outerStart.y}`,
    `A ${R - 4} ${R - 4} 0 0 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${INNER} ${INNER} 0 0 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
}

export function MoodWheel({ onPick, activeWedgeId, disabled }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [energy, setEnergy] = useState(0.7);

  const wedges = useMemo(
    () =>
      WEDGES.map((w, i) => {
        const start = i * 30;
        const end = start + 30;
        return { ...w, idx: i, start, end, d: wedgePath(start, end) };
      }),
    [],
  );

  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    if (disabled) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const dist = Math.sqrt(x * x + y * y);
    const maxR = rect.width / 2 - 4;
    const e01 = Math.max(0.2, Math.min(1, dist / maxR));
    setEnergy(e01);
    const angle = (Math.atan2(y, x) * 180) / Math.PI + 90;
    const pick = pickFromAngle(angle, e01);
    onPick(pick);
  }

  return (
    <div className="mood-wheel" aria-disabled={disabled}>
      <svg
        ref={svgRef}
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        onClick={handleClick}
        style={{ cursor: disabled ? "not-allowed" : "pointer" }}
      >
        <defs>
          <radialGradient id="hub" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1b1c2a" />
            <stop offset="100%" stopColor="#0a0b14" />
          </radialGradient>
        </defs>
        {wedges.map((w) => {
          const active = w.id === activeWedgeId;
          const hovered = hoverIdx === w.idx;
          return (
            <path
              key={w.id}
              d={w.d}
              fill={`hsl(${w.hue} 85% ${active ? 62 : hovered ? 56 : 48}%)`}
              opacity={active ? 1 : hovered ? 0.95 : 0.78}
              stroke="#0a0b14"
              strokeWidth={2}
              onMouseEnter={() => setHoverIdx(w.idx)}
              onMouseLeave={() => setHoverIdx((i) => (i === w.idx ? null : i))}
            >
              <title>{w.label}</title>
            </path>
          );
        })}
        <circle cx={R} cy={R} r={INNER - 2} fill="url(#hub)" stroke="#2a2c40" />
        <text
          x={R}
          y={R - 4}
          textAnchor="middle"
          fontSize={11}
          fill="#9aa0c0"
          style={{ letterSpacing: 1 }}
        >
          MOOD
        </text>
        <text
          x={R}
          y={R + 12}
          textAnchor="middle"
          fontSize={11}
          fill="#5af7ff"
          style={{ letterSpacing: 1 }}
        >
          {Math.round(energy * 100)}%
        </text>
      </svg>
      <p className="mood-hint">
        Click a wedge. Closer to the rim = more energy (higher BPM).
      </p>
    </div>
  );
}
