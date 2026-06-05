interface Props {
  x: number;
  y: number;
  color: string;
  active: boolean;
}

export function Spotlight({ x, y, color, active }: Props) {
  return (
    <div
      className={`spotlight ${active ? "spotlight--on" : ""}`}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        background: `radial-gradient(circle, ${color}55 0%, ${color}00 60%)`,
      }}
    />
  );
}
