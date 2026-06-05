export function moodsToPrompt(moods: string[]): string {
  if (moods.length === 0) {
    return "Electronic beat mix, layered textures, dynamic rhythm";
  }
  return `Electronic beat mix blending ${moods.join(", ")} moods, layered textures, dynamic rhythm, club-ready energy`;
}
