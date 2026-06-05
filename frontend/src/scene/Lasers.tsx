interface Props {
  color: string;
  active: boolean;
}

/** Two sweeping laser beams from the back corners — pure CSS animation. */
export function Lasers({ color, active }: Props) {
  return (
    <>
      <div
        className={`laser laser--left ${active ? "laser--on" : ""}`}
        style={{ background: `linear-gradient(90deg, ${color}aa 0%, ${color}00 70%)` }}
      />
      <div
        className={`laser laser--right ${active ? "laser--on" : ""}`}
        style={{ background: `linear-gradient(-90deg, ${color}aa 0%, ${color}00 70%)` }}
      />
    </>
  );
}
