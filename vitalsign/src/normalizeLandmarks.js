export function normalizeLandmarks(landmarks) {
  const base = landmarks[0]; // wrist

  return landmarks.flatMap((lm) => [
    lm.x - base.x,
    lm.y - base.y,
  ]);
}

