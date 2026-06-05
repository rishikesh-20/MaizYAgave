export const MIN_MOOD_SELECTIONS = 1;
export const MAX_MOOD_SELECTIONS = 3;
export const SIMILAR_SUGGESTION_COUNT = 5;

export type WordZone =
  | "joyful"
  | "peaceful"
  | "melancholic"
  | "dreamy"
  | "passionate";

export interface ZoneStyle {
  id: WordZone;
  label: string;
  color: string;
  glow: string;
  startAngle: number;
  endAngle: number;
}

export interface MoodCluster {
  zone: WordZone;
  words: [string, string, string, string, string];
}

/** 20 clusters × 5 words = 100 common mood descriptors */
export const MOOD_CLUSTERS: MoodCluster[] = [
  // Joyful (4 clusters)
  { zone: "joyful", words: ["Happy", "Joyful", "Cheerful", "Delighted", "Elated"] },
  { zone: "joyful", words: ["Blissful", "Ecstatic", "Upbeat", "Lively", "Playful"] },
  { zone: "joyful", words: ["Carefree", "Lighthearted", "Optimistic", "Hopeful", "Buoyant"] },
  { zone: "joyful", words: ["Exuberant", "Gleeful", "Merry", "Jubilant", "Radiant"] },
  // Peaceful (4 clusters)
  { zone: "peaceful", words: ["Peaceful", "Calm", "Serene", "Tranquil", "Relaxed"] },
  { zone: "peaceful", words: ["Content", "Balanced", "Harmonious", "Composed", "Still"] },
  { zone: "peaceful", words: ["Gentle", "Soft", "Quiet", "Mellow", "Soothing"] },
  { zone: "peaceful", words: ["Restful", "Placid", "Centered", "Grounded", "At Ease"] },
  // Melancholic (4 clusters)
  { zone: "melancholic", words: ["Sad", "Melancholic", "Somber", "Gloomy", "Blue"] },
  { zone: "melancholic", words: ["Lonely", "Hollow", "Weary", "Drained", "Heavy"] },
  { zone: "melancholic", words: ["Mournful", "Wistful", "Longing", "Nostalgic", "Pensive"] },
  { zone: "melancholic", words: ["Subdued", "Tender", "Fragile", "Vulnerable", "Quiet"] },
  // Dreamy (4 clusters)
  { zone: "dreamy", words: ["Dreamy", "Ethereal", "Mystical", "Whimsical", "Surreal"] },
  { zone: "dreamy", words: ["Imaginative", "Fantastical", "Enchanted", "Magical", "Cosmic"] },
  { zone: "dreamy", words: ["Floating", "Hazy", "Hypnotic", "Mesmerizing", "Spellbound"] },
  { zone: "dreamy", words: ["Wonder", "Awestruck", "Inspired", "Creative", "Poetic"] },
  // Passionate (4 clusters)
  { zone: "passionate", words: ["Passionate", "Intense", "Fierce", "Bold", "Powerful"] },
  { zone: "passionate", words: ["Energetic", "Driven", "Determined", "Fiery", "Heated"] },
  { zone: "passionate", words: ["Urgent", "Wild", "Raw", "Electric", "Vibrant"] },
  { zone: "passionate", words: ["Dynamic", "Ardent", "Zealous", "Thrilling", "Adrenaline"] },
];

export const ALL_MOOD_WORDS: string[] = MOOD_CLUSTERS.flatMap((c) => c.words);

export const WORD_ZONES: ZoneStyle[] = [
  {
    id: "joyful",
    label: "Joyful",
    color: "#f0c84a",
    glow: "rgba(240, 200, 74, 0.55)",
    startAngle: -125,
    endAngle: -55,
  },
  {
    id: "peaceful",
    label: "Peaceful",
    color: "#5ecf8a",
    glow: "rgba(94, 207, 138, 0.5)",
    startAngle: -45,
    endAngle: 35,
  },
  {
    id: "melancholic",
    label: "Melancholic",
    color: "#6eb8f5",
    glow: "rgba(110, 184, 245, 0.5)",
    startAngle: 45,
    endAngle: 105,
  },
  {
    id: "dreamy",
    label: "Dreamy",
    color: "#c49bff",
    glow: "rgba(196, 155, 255, 0.5)",
    startAngle: 115,
    endAngle: 175,
  },
  {
    id: "passionate",
    label: "Passionate",
    color: "#ff6b4a",
    glow: "rgba(255, 107, 74, 0.55)",
    startAngle: 185,
    endAngle: 245,
  },
];

const wordZoneMap = new Map<string, WordZone>(
  MOOD_CLUSTERS.flatMap((c) => c.words.map((w) => [w, c.zone] as const))
);

const clusterByWord = new Map<string, MoodCluster>(
  MOOD_CLUSTERS.flatMap((c) => c.words.map((w) => [w, c] as const))
);

export function getWordZone(word: string): WordZone {
  return wordZoneMap.get(word) ?? "peaceful";
}

export function getZoneStyle(zone: WordZone): ZoneStyle {
  return WORD_ZONES.find((z) => z.id === zone)!;
}

/** Up to 5 mood words similar to the anchor (same cluster first, then same zone). */
export function getSimilarWords(anchor: string): string[] {
  const cluster = clusterByWord.get(anchor);
  if (!cluster) return [];

  const siblings = cluster.words.filter((w) => w !== anchor);
  if (siblings.length >= SIMILAR_SUGGESTION_COUNT) {
    return siblings.slice(0, SIMILAR_SUGGESTION_COUNT);
  }

  const extras: string[] = [];
  for (const c of MOOD_CLUSTERS) {
    if (c.zone !== cluster.zone || c === cluster) continue;
    for (const w of c.words) {
      if (w === anchor || siblings.includes(w) || extras.includes(w)) continue;
      extras.push(w);
      if (siblings.length + extras.length >= SIMILAR_SUGGESTION_COUNT) {
        return [...siblings, ...extras].slice(0, SIMILAR_SUGGESTION_COUNT);
      }
    }
  }
  return [...siblings, ...extras].slice(0, SIMILAR_SUGGESTION_COUNT);
}

export interface CloudWord {
  text: string;
  zone: WordZone;
  tier: "primary" | "secondary";
  angle: number;
  radius: number;
}

const GOLDEN_ANGLE = 137.508;

function buildCloudLayout(): CloudWord[] {
  const words: CloudWord[] = [];
  let globalIndex = 0;

  for (const zone of WORD_ZONES) {
    const zoneWords = MOOD_CLUSTERS.filter((c) => c.zone === zone.id).flatMap(
      (c) => c.words
    );
    zoneWords.forEach((text, i) => {
      const cluster = clusterByWord.get(text)!;
      const isPrimary = cluster.words[0] === text;
      const angle =
        zone.startAngle +
        ((zone.endAngle - zone.startAngle) * (i + 0.5)) / zoneWords.length;
      const radius = 0.38 + (i % 4) * 0.03 + (globalIndex % 3) * 0.01;
      words.push({
        text,
        zone: zone.id,
        tier: isPrimary ? "primary" : "secondary",
        angle,
        radius,
      });
      globalIndex += 1;
    });
  }

  // Fallback golden spiral for any missed (should be exactly 100)
  if (words.length < ALL_MOOD_WORDS.length) {
    ALL_MOOD_WORDS.forEach((text, i) => {
      if (words.some((w) => w.text === text)) return;
      const angle = (i * GOLDEN_ANGLE) % 360;
      const radius = 0.35 + (i % 12) * 0.012;
      words.push({
        text,
        zone: getWordZone(text),
        tier: "secondary",
        angle: angle - 180,
        radius,
      });
    });
  }

  return words;
}

export const CLOUD_WORDS = buildCloudLayout();
