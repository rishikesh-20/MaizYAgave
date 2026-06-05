export type DjId = "nova" | "lumen" | "pulse" | "volt" | "zephyr";

export interface Persona {
  id: DjId;
  name: string;
  genre: string;
  bpmMin: number;
  bpmMax: number;
  palette: { body: string; accent: string; glow: string };
  promptSeeds: string;
  homeDesk: { x: number; y: number };
}

export const PERSONAS: Record<DjId, Persona> = {
  nova: {
    id: "nova",
    name: "NOVA",
    genre: "Synthwave",
    bpmMin: 80,
    bpmMax: 100,
    palette: { body: "#ff4fa3", accent: "#5af7ff", glow: "#ff4fa3" },
    promptSeeds:
      "80s synthwave, gated reverb drums, analog pads, neon arpeggios, retro chorus guitar",
    homeDesk: { x: 14, y: 26 },
  },
  lumen: {
    id: "lumen",
    name: "LUMEN",
    genre: "Ambient",
    bpmMin: 60,
    bpmMax: 80,
    palette: { body: "#9ec5ff", accent: "#e8f1ff", glow: "#9ec5ff" },
    promptSeeds:
      "deep ambient, warm evolving pads, soft granular textures, sub bass, sparse",
    homeDesk: { x: 30, y: 26 },
  },
  pulse: {
    id: "pulse",
    name: "PULSE",
    genre: "Deep House",
    bpmMin: 118,
    bpmMax: 126,
    palette: { body: "#ffa64d", accent: "#ffd27a", glow: "#ffa64d" },
    promptSeeds:
      "deep house, four-on-the-floor kick, warm rolling bassline, jazzy chords, vinyl crackle",
    homeDesk: { x: 14, y: 60 },
  },
  volt: {
    id: "volt",
    name: "VOLT",
    genre: "Techno",
    bpmMin: 128,
    bpmMax: 138,
    palette: { body: "#1a1a1a", accent: "#ff2e3a", glow: "#ff2e3a" },
    promptSeeds:
      "driving industrial techno, hypnotic loop, distorted kick, dark atmosphere, modular synth",
    homeDesk: { x: 30, y: 60 },
  },
  zephyr: {
    id: "zephyr",
    name: "ZEPHYR",
    genre: "Drum & Bass",
    bpmMin: 170,
    bpmMax: 180,
    palette: { body: "#7CFF6B", accent: "#b6ffae", glow: "#7CFF6B" },
    promptSeeds:
      "liquid drum and bass, amen breaks, atmospheric pads, rolling sub bass, euphoric",
    homeDesk: { x: 78, y: 26 },
  },
};

export const DJ_IDS: DjId[] = ["nova", "lumen", "pulse", "volt", "zephyr"];

export interface MoodContext {
  label: string;
  descriptor: string;
}

export function buildPrompt(
  dj: Persona,
  mood: MoodContext,
  bpm: number,
): string {
  return [
    dj.promptSeeds,
    `${Math.round(bpm)} BPM`,
    `mood: ${mood.descriptor}`,
    "electronic, instrumental, looping",
  ].join(", ");
}

export function clampBpm(dj: Persona, energy: number): number {
  const t = Math.max(0, Math.min(1, energy));
  return dj.bpmMin + (dj.bpmMax - dj.bpmMin) * t;
}
