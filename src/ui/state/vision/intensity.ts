import { NotImplementedError } from "@/src/lib/http";
import type { VisionFrame, IntensityScore } from "./types";

export function computeIntensity(_frames: VisionFrame[]): IntensityScore {
  throw new NotImplementedError("Intensity scoring not implemented");
}
