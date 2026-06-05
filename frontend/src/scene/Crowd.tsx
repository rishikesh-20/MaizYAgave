import { useBpmClock } from "./useBpmClock";

const SHEET = "/sprites/crowd.png";
const FRAME = 32;

interface DancerSpec {
  x: number;
  y: number;
  scale: number;
  offset: number; // 0..1 phase offset
}

const DANCERS: DancerSpec[] = [
  { x: 40, y: 58, scale: 0.9, offset: 0.0 },
  { x: 46, y: 60, scale: 1.0, offset: 0.25 },
  { x: 54, y: 60, scale: 1.0, offset: 0.5 },
  { x: 60, y: 58, scale: 0.9, offset: 0.75 },
  { x: 50, y: 62, scale: 0.85, offset: 0.1 },
];

interface Props {
  bpm: number;
  enabled: boolean;
}

export function Crowd({ bpm, enabled }: Props) {
  const phase = useBpmClock(bpm, enabled);

  return (
    <>
      {DANCERS.map((d, i) => {
        const localPhase = (phase + d.offset) % 1;
        // Two-frame cycle, alternates every half beat.
        const frameIdx = localPhase < 0.5 ? 0 : 1;
        // Add a tiny y-bob.
        const bob = Math.sin(localPhase * Math.PI * 2) * 0.6;
        return (
          <div
            key={i}
            className="crowd-dancer"
            style={{
              left: `${d.x}%`,
              top: `${d.y + bob * 0.1}%`,
              width: FRAME,
              height: FRAME,
              transform: `translate(-50%, -100%) scale(${d.scale})`,
              backgroundImage: `url(${SHEET})`,
              backgroundSize: `${FRAME * 2}px ${FRAME}px`,
              backgroundPosition: `${-frameIdx * FRAME}px 0px`,
            }}
          />
        );
      })}
    </>
  );
}
