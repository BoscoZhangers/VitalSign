import { NotImplementedError } from "@/src/lib/http";
import type { RefineRequest, RefineResponse } from "@/src/contracts/types";

export async function refineWithGemini(_req: RefineRequest): Promise<RefineResponse> {
  throw new NotImplementedError("Gemini call not implemented");
}
