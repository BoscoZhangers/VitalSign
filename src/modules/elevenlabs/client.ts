import { NotImplementedError } from "@/src/lib/http";
import type { SpeakRequest } from "@/src/contracts/types";

export async function speakWithElevenLabs(_req: SpeakRequest): Promise<ArrayBuffer> {
  throw new NotImplementedError("ElevenLabs call not implemented");
}
