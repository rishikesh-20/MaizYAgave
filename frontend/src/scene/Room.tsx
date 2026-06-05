import { DJ_IDS, PERSONAS, type DjId, type Persona } from "../djs/personas";
import { Avatar } from "./Avatar";
import { Booth, BOOTH_POS } from "./Booth";
import { Crowd } from "./Crowd";
import { Lasers } from "./Lasers";
import { Spotlight } from "./Spotlight";
import { Subwoofers } from "./Subwoofers";
import { WalkingDj } from "./WalkingDj";

interface Props {
  activeDjId: DjId | null;
  bpm?: number;
  isPlaying: boolean;
  isWarming?: boolean;
  walkDurationMs?: number;
  onArrived?: () => void;
}

export function Room({
  activeDjId,
  bpm,
  isPlaying,
  isWarming,
  walkDurationMs,
  onArrived,
}: Props) {
  const activeDj: Persona | null = activeDjId ? PERSONAS[activeDjId] : null;
  const effectiveBpm = bpm ?? 120;
  const dynamicsOn = isPlaying || !!isWarming;

  return (
    <div className={`room ${isPlaying ? "room--playing" : ""}`}>
      {/* Background layers — drawn back to front */}
      <div className="room-wall" />
      <Subwoofers
        bpm={effectiveBpm}
        enabled={dynamicsOn}
        color={activeDj?.palette.glow ?? "#5af7ff"}
      />
      <div className="room-floor" />

      {/* DJ desk posters (palette tinted) above each desk. Cuttable. */}
      {DJ_IDS.map((id) => {
        const p = PERSONAS[id];
        return (
          <div
            key={`poster-${id}`}
            className="poster"
            style={{
              left: `${p.homeDesk.x}%`,
              top: `${p.homeDesk.y - 12}%`,
              borderColor: p.palette.glow,
              boxShadow: `0 0 6px ${p.palette.glow}80`,
            }}
          >
            <div
              className="poster-fill"
              style={{
                background: `linear-gradient(160deg, ${p.palette.body} 0%, ${p.palette.glow} 100%)`,
              }}
            />
            <div className="poster-label">{p.name}</div>
          </div>
        );
      })}

      {/* Desks */}
      {DJ_IDS.map((id) => {
        const p = PERSONAS[id];
        return (
          <div
            key={`desk-${id}`}
            className="desk"
            style={{
              left: `${p.homeDesk.x}%`,
              top: `${p.homeDesk.y + 4}%`,
            }}
          />
        );
      })}

      {/* Crowd in front of the booth */}
      <Crowd bpm={effectiveBpm} enabled={dynamicsOn} />

      {/* Lasers + spotlight render under the booth + avatars */}
      <Lasers color={activeDj?.palette.glow ?? "#5af7ff"} active={dynamicsOn} />
      <Spotlight
        x={BOOTH_POS.x}
        y={BOOTH_POS.y}
        color={activeDj?.palette.glow ?? "#ffffff"}
        active={!!activeDj}
      />

      {/* Booth (under the active DJ) */}
      <Booth activeDj={activeDj} bpm={bpm} isWarming={isWarming} />

      {/* Idle DJs at their desks (everyone except the currently active one) */}
      {DJ_IDS.filter((id) => id !== activeDjId).map((id) => {
        const p = PERSONAS[id];
        return (
          <Avatar
            key={`home-${id}`}
            persona={p}
            x={p.homeDesk.x}
            y={p.homeDesk.y}
            direction="down"
            isMoving={false}
            bpm={effectiveBpm}
          />
        );
      })}

      {/* Active DJ — walks from desk to booth */}
      {activeDj && onArrived && (
        <WalkingDj
          key={activeDj.id}
          persona={activeDj}
          bpm={effectiveBpm}
          walkDurationMs={walkDurationMs}
          onArrived={onArrived}
        />
      )}
    </div>
  );
}
