import type { MoodEntry } from "../data/moods";
import { MOODS, MOOD_SECTORS, getMoodById } from "../data/moods";

/** Placed under the title — kept off the wheel so they don't cover the headline */
export const HEADER_MOOD_IDS = ["serene", "comforted", "content"] as const;
const HEADER_MOOD_ID_SET = new Set<string>(HEADER_MOOD_IDS);

export function getHeaderMoods(): MoodEntry[] {
  return HEADER_MOOD_IDS.map((id) => getMoodById(id)).filter(
    (m): m is MoodEntry => m !== undefined
  );
}

export interface PositionedMood extends MoodEntry {
  angle: number;
  radius: number;
  fontSize: number;
  animDelay: number;
}

const EDGE_PAD = 5;
const INNER_RADIUS = 22;
const OUTER_RINGS = [44, 56, 68];

function fontSizeFor(label: string, primary: boolean): number {
  if (primary) return label.length > 9 ? 1.05 : 1.15;
  if (label.length > 11) return 0.72;
  if (label.length > 8) return 0.8;
  return 0.88;
}

function placeOnRing(
  moods: MoodEntry[],
  startAngle: number,
  endAngle: number,
  radius: number
): PositionedMood[] {
  if (moods.length === 0) return [];

  const span = endAngle - startAngle - EDGE_PAD * 2;
  const step = span / moods.length;

  return moods.map((mood, i) => ({
    ...mood,
    angle: startAngle + EDGE_PAD + step * i + step / 2,
    radius,
    fontSize: fontSizeFor(mood.label, !!mood.primary),
    animDelay: 0,
  }));
}

function layoutSector(
  startAngle: number,
  endAngle: number,
  moods: MoodEntry[]
): PositionedMood[] {
  const primary = moods.filter((m) => m.primary);
  const secondary = moods.filter((m) => !m.primary);
  const placed: PositionedMood[] = [];

  if (primary.length > 0) {
    placed.push(...placeOnRing(primary, startAngle, endAngle, INNER_RADIUS));
  }

  if (secondary.length === 0) return placed;

  const ringCount =
    secondary.length > 14 ? 3 : secondary.length > 7 ? 2 : 1;
  const chunkSize = Math.ceil(secondary.length / ringCount);

  for (let ring = 0; ring < ringCount; ring += 1) {
    const slice = secondary.slice(ring * chunkSize, (ring + 1) * chunkSize);
    if (slice.length === 0) continue;
    placed.push(
      ...placeOnRing(
        slice,
        startAngle,
        endAngle,
        OUTER_RINGS[Math.min(ring, OUTER_RINGS.length - 1)]
      )
    );
  }

  return placed;
}

/** Even angular spacing per sector, stacked on separate rings to avoid overlap. */
export function layoutMoods(): PositionedMood[] {
  const positioned: PositionedMood[] = [];
  let globalIndex = 0;

  for (const sector of MOOD_SECTORS) {
    const sectorMoods = MOODS.filter(
      (m) => m.sector === sector.id && !HEADER_MOOD_ID_SET.has(m.id)
    );
    const sectorPlaced = layoutSector(
      sector.startAngle,
      sector.endAngle,
      sectorMoods
    );
    for (const mood of sectorPlaced) {
      positioned.push({
        ...mood,
        animDelay: globalIndex * 0.065,
      });
      globalIndex += 1;
    }
  }

  return positioned;
}
