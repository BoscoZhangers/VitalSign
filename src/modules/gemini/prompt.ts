export function buildRefinePrompt(input: { rawText: string; intensity: number }): string {
  // Keep prompt shape stable; tune later.
  return [
    "You are a text refiner for a non-verbal/deaf user.",
    "Return ONLY JSON: { \"text\": string, \"tone\": one of Neutral|Calm|Happy|Sad|Angry|Urgent }.",
    `Raw Text: ${JSON.stringify(input.rawText)}`,
    `Intensity (0-100): ${input.intensity}`
  ].join("\n");
}
