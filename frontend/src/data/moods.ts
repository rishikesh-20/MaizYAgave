export type MoodSectorId =
  | "joyful"
  | "peaceful"
  | "melancholic"
  | "dreamy"
  | "powerful";

export interface MoodEntry {
  id: string;
  label: string;
  sector: MoodSectorId;
  primary?: boolean;
  /** Lyria prompt fragment layered on the sector base style */
  style: string;
}

export interface MoodSector {
  id: MoodSectorId;
  color: string;
  glow: string;
  startAngle: number;
  endAngle: number;
  baseStyle: string;
}

export const MOOD_SECTORS: MoodSector[] = [
  {
    id: "joyful",
    color: "#f5c842",
    glow: "rgba(245, 200, 66, 0.55)",
    startAngle: -87,
    endAngle: -21,
    baseStyle:
      "Instrumental only, upbeat and warm, major key, lively rhythm, no vocals",
  },
  {
    id: "peaceful",
    color: "#5ecf7a",
    glow: "rgba(94, 207, 122, 0.5)",
    startAngle: -15,
    endAngle: 51,
    baseStyle:
      "Instrumental only, calm and balanced, soft textures, gentle flow, no vocals",
  },
  {
    id: "melancholic",
    color: "#4da3ff",
    glow: "rgba(77, 163, 255, 0.5)",
    startAngle: 57,
    endAngle: 123,
    baseStyle:
      "Instrumental only, slow and emotional, minor key, sparse arrangement, no vocals",
  },
  {
    id: "dreamy",
    color: "#b06cff",
    glow: "rgba(176, 108, 255, 0.5)",
    startAngle: 129,
    endAngle: 195,
    baseStyle:
      "Instrumental only, ethereal and floating, reverb-heavy pads, surreal atmosphere, no vocals",
  },
  {
    id: "powerful",
    color: "#ff5c45",
    glow: "rgba(255, 92, 69, 0.55)",
    startAngle: 201,
    endAngle: 267,
    baseStyle:
      "Instrumental only, intense and driving, bold drums, cinematic energy, no vocals",
  },
];

export const MOODS: MoodEntry[] = [
  // Joyful
  { id: "joyful", label: "Joyful", sector: "joyful", primary: true, style: "radiant celebration, bouncy groove, 118 BPM" },
  { id: "radiant", label: "Radiant", sector: "joyful", style: "sunlit synth arpeggios, sparkling highs" },
  { id: "spontaneous", label: "Spontaneous", sector: "joyful", style: "playful syncopation, surprise melodic turns" },
  { id: "lighthearted", label: "Lighthearted", sector: "joyful", style: "airy plucks, soft hand percussion" },
  { id: "carefree", label: "Carefree", sector: "joyful", style: "easygoing shuffle, whistling lead melody" },
  { id: "upbeat", label: "Upbeat", sector: "joyful", style: "four-on-the-floor kick, bright stabs" },
  { id: "cheerful", label: "Cheerful", sector: "joyful", style: "major seventh chords, claps and bells" },
  { id: "hopeful", label: "Hopeful", sector: "joyful", style: "rising progression, warm strings" },
  { id: "warm", label: "Warm", sector: "joyful", style: "analog bass, cozy Rhodes piano" },
  { id: "adventurous", label: "Adventurous", sector: "joyful", style: "world percussion, bold brass accents" },

  // Peaceful
  { id: "peaceful", label: "Peaceful", sector: "peaceful", primary: true, style: "slow breathing tempo, 72 BPM, open space" },
  { id: "balanced", label: "Balanced", sector: "peaceful", style: "even dynamics, centered mix" },
  { id: "harmonious", label: "Harmonious", sector: "peaceful", style: "consonant layers, gentle countermelody" },
  { id: "refreshing", label: "Refreshing", sector: "peaceful", style: "light mallet tones, morning clarity" },
  { id: "natural", label: "Natural", sector: "peaceful", style: "acoustic guitar, subtle field recordings" },
  { id: "restful", label: "Restful", sector: "peaceful", style: "long sustained pads, minimal movement" },
  { id: "tranquil", label: "Tranquil", sector: "peaceful", style: "soft harp, distant wind textures" },
  { id: "serene", label: "Serene", sector: "peaceful", style: "glassy ambient tones, slow waves" },
  { id: "comforted", label: "Comforted", sector: "peaceful", style: "warm low drones, lullaby feel" },
  { id: "content", label: "Content", sector: "peaceful", style: "simple motif, unhurried repetition" },
  { id: "thoughtful", label: "Thoughtful", sector: "peaceful", style: "solo piano, introspective phrasing" },
  { id: "empathetic", label: "Empathetic", sector: "peaceful", style: "tender cello, compassionate tone" },

  // Melancholic
  { id: "melancholic", label: "Melancholic", sector: "melancholic", primary: true, style: "lonely piano, 68 BPM, rainy mood" },
  { id: "sad", label: "Sad", sector: "melancholic", style: "descending melody, muted strings" },
  { id: "lonely", label: "Lonely", sector: "melancholic", style: "single voice instrument, wide reverb" },
  { id: "nostalgic", label: "Nostalgic", sector: "melancholic", style: "vinyl warmth, faded tape hiss" },
  { id: "longing", label: "Longing", sector: "melancholic", style: "unresolved cadences, distant echo" },
  { id: "pensive", label: "Pensive", sector: "melancholic", style: "sparse notes, long pauses" },
  { id: "bored", label: "Bored", sector: "melancholic", style: "monotone loop, hypnotic repetition" },
  { id: "tired", label: "Tired", sector: "melancholic", style: "slow drag, heavy low end" },
  { id: "drained", label: "Drained", sector: "melancholic", style: "minimal energy, fading dynamics" },
  { id: "disappointed", label: "Disappointed", sector: "melancholic", style: "minor second tension, soft collapse" },
  { id: "hurt", label: "Hurt", sector: "melancholic", style: "fragile high register, tremolo" },

  // Dreamy
  { id: "dreamy", label: "Dreamy", sector: "dreamy", primary: true, style: "shimmering pads, 80 BPM, floating" },
  { id: "imaginative", label: "Imaginative", sector: "dreamy", style: "unexpected harmonies, playful motifs" },
  { id: "whimsical", label: "Whimsical", sector: "dreamy", style: "music box tones, light glockenspiel" },
  { id: "mystical", label: "Mystical", sector: "dreamy", style: "distant choir pads, ritual drums" },
  { id: "creative", label: "Creative", sector: "dreamy", style: "evolving textures, morphing timbres" },
  { id: "inspired", label: "Inspired", sector: "dreamy", style: "uplifting swell, celestial bloom" },
  { id: "reflective", label: "Reflective", sector: "dreamy", style: "mirror-like delay, soft pulse" },
  { id: "awestruck", label: "Awestruck", sector: "dreamy", style: "vast orchestral wash, slow build" },
  { id: "enchanted", label: "Enchanted", sector: "dreamy", style: "sparkling bells, fairy dust highs" },
  { id: "surreal", label: "Surreal", sector: "dreamy", style: "detuned layers, abstract sound design" },
  { id: "contemplative", label: "Contemplative", sector: "dreamy", style: "meditative drone, slow evolution" },
  { id: "spiritual", label: "Spiritual", sector: "dreamy", style: "singing bowls, incense-like ambience" },

  // Powerful
  { id: "powerful", label: "Powerful", sector: "powerful", primary: true, style: "massive drums, 128 BPM, heroic" },
  { id: "passionate", label: "Passionate", sector: "powerful", primary: true, style: "fiery strings, bold crescendo" },
  { id: "excited", label: "Excited", sector: "powerful", style: "fast hi-hats, rising energy" },
  { id: "determined", label: "Determined", sector: "powerful", style: "marching rhythm, steady forward drive" },
  { id: "fierce", label: "Fierce", sector: "powerful", style: "distorted bass, aggressive staccato" },
  { id: "intense", label: "Intense", sector: "powerful", style: "tight compression, relentless pulse" },
  { id: "confident", label: "Confident", sector: "powerful", style: "strong brass hits, swagger groove" },
  { id: "playful", label: "Playful", sector: "powerful", style: "funk bass, energetic call and response" },
  { id: "anxious", label: "Anxious", sector: "powerful", style: "tense ostinato, irregular accents" },
  { id: "stressed", label: "Stressed", sector: "powerful", style: "rapid percussion, claustrophobic mix" },
  { id: "agitated", label: "Agitated", sector: "powerful", style: "dissonant stabs, urgent tempo" },
];

const sectorById = Object.fromEntries(
  MOOD_SECTORS.map((s) => [s.id, s])
) as Record<MoodSectorId, MoodSector>;

export function buildMoodPrompt(mood: MoodEntry): string {
  const sector = sectorById[mood.sector];
  return `${sector.baseStyle}. Mood: ${mood.label.toLowerCase()} — ${mood.style}.`;
}

export function getMoodById(id: string): MoodEntry | undefined {
  return MOODS.find((m) => m.id === id);
}

export function getSectorColor(sectorId: MoodSectorId): string {
  return sectorById[sectorId].color;
}

export function getSectorGlow(sectorId: MoodSectorId): string {
  return sectorById[sectorId].glow;
}
