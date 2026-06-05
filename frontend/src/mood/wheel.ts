import type { DjId, MoodContext } from "../djs/personas";

export interface Wedge {
  id: string;
  label: string;
  descriptor: string;
  hue: number;
  djId: DjId;
}

// 12 wedges, 30deg each, starting at top (12 o'clock) going clockwise.
// Hue is approximate; matches the wedge fill color.
export const WEDGES: Wedge[] = [
  { id: "hype",       label: "Hype",       descriptor: "high-energy, aggressive, peak-time",   hue: 0,   djId: "volt"   },
  { id: "euphoric",   label: "Euphoric",   descriptor: "uplifting, warm, sunlit",              hue: 25,  djId: "pulse"  },
  { id: "playful",    label: "Playful",    descriptor: "bright, nostalgic, retro-fun",         hue: 50,  djId: "nova"   },
  { id: "golden",     label: "Golden",     descriptor: "groovy, golden-hour, optimistic",      hue: 70,  djId: "pulse"  },
  { id: "focused",    label: "Focused",    descriptor: "calm, productive, minimal",            hue: 110, djId: "lumen"  },
  { id: "serene",     label: "Serene",     descriptor: "still, meditative, weightless",        hue: 150, djId: "lumen"  },
  { id: "melancholy", label: "Melancholy", descriptor: "wistful, slow, blue-hour",             hue: 200, djId: "lumen"  },
  { id: "dreamy",     label: "Dreamy",     descriptor: "hazy, romantic, drifting",             hue: 240, djId: "nova"   },
  { id: "mystic",     label: "Mystic",     descriptor: "hypnotic, dark, ritualistic",          hue: 270, djId: "volt"   },
  { id: "restless",   label: "Restless",   descriptor: "edgy, urgent, breakbeat",              hue: 300, djId: "zephyr" },
  { id: "elated",     label: "Elated",     descriptor: "soaring, atmospheric, euphoric DnB",   hue: 320, djId: "zephyr" },
  { id: "raw",        label: "Raw",        descriptor: "primal, distorted, peak-aggression",   hue: 345, djId: "volt"   },
];

export interface WheelPick {
  wedge: Wedge;
  mood: MoodContext;
  djId: DjId;
  energy: number; // 0..1 (radius)
}

export function pickFromAngle(angleDeg: number, energy: number): WheelPick {
  // Normalize 0..360
  const a = ((angleDeg % 360) + 360) % 360;
  const idx = Math.floor(a / 30) % WEDGES.length;
  const wedge = WEDGES[idx];
  return {
    wedge,
    djId: wedge.djId,
    energy: Math.max(0, Math.min(1, energy)),
    mood: { label: wedge.label, descriptor: wedge.descriptor },
  };
}
