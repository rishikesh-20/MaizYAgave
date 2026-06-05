import { DJ_IDS, PERSONAS, type DjId, type Persona } from "../djs/personas";
import { Avatar } from "./Avatar";
import { Booth, BOOTH_POS } from "./Booth";
import { Spotlight } from "./Spotlight";

interface Props {
  activeDjId: DjId | null;
  bpm?: number;
  isWarming?: boolean;
}

export function Room({ activeDjId, bpm, isWarming }: Props) {
  const activeDj: Persona | null = activeDjId ? PERSONAS[activeDjId] : null;

  return (
    <div className="room">
      <div className="room-floor" />
      <div className="room-wall" />

      {/* Desks — drawn under avatars */}
      {DJ_IDS.map((id) => {
        const p = PERSONAS[id];
        return (
          <div
            key={`desk-${id}`}
            className="desk"
            style={{
              left: `${p.homeDesk.x}%`,
              top: `${p.homeDesk.y + 8}%`,
            }}
          />
        );
      })}

      {/* Booth marker is drawn before active avatar so avatar sits on top */}
      <Booth activeDj={activeDj} bpm={bpm} isWarming={isWarming} />

      {/* Spotlight on the booth — only when a DJ is active */}
      <Spotlight
        x={BOOTH_POS.x}
        y={BOOTH_POS.y}
        color={activeDj?.palette.glow ?? "#ffffff"}
        active={!!activeDj}
      />

      {/* Idle DJs at their home desks. Active DJ is also rendered at the booth. */}
      {DJ_IDS.map((id) => {
        const p = PERSONAS[id];
        const isActive = id === activeDjId;
        return (
          <Avatar
            key={`home-${id}`}
            persona={p}
            x={p.homeDesk.x}
            y={p.homeDesk.y}
            active={false}
            scale={isActive ? 0.7 : 1}
          />
        );
      })}

      {activeDj && (
        <Avatar
          key={`booth-${activeDj.id}`}
          persona={activeDj}
          x={BOOTH_POS.x}
          y={BOOTH_POS.y - 6}
          active
          scale={1.25}
        />
      )}
    </div>
  );
}
