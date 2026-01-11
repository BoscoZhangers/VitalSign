// Simple heuristic classifier for MVP
export function classifyASLLetter(landmarks = []) {
  const tips = [8, 12, 16, 20]; // index → pinky

  // Check that landmarks has enough points
  if (!Array.isArray(landmarks) || landmarks.length < 21) {
    console.warn("Invalid landmarks array:", landmarks);
    return "";
  }

  const folded = tips.map((i) => {
    // Ensure landmarks[i] exists
    if (!landmarks[i]) return false; // treat missing points as folded
    return landmarks[i].y > landmarks[0].y;
  });

  // ✋ Open hand → B
  if (folded.every((f) => !f)) return "B";

  // ✊ Fist → A
  if (folded.every((f) => f)) return "A";

  // ☝️ Index up → D
  if (!folded[0] && folded.slice(1).every(Boolean)) return "D";

  // 🤙 Y
  if (!folded[0] && folded[1] && folded[2] && !folded[3]) return "Y";

  return "";
}
