import type { ToneTag } from "@/src/contracts/types";

export type VoiceConfig = {
  voiceId?: string;
  // Placeholder for stability/similarity/style/etc.
};

export function voiceForTone(_tone: ToneTag): VoiceConfig {
  // Decide mapping later.
  return {};
}
