import {
  GestureRecognizer,
  FilesetResolver,
} from "@mediapipe/tasks-vision";

let gestureRecognizer;

export async function initGestureRecognizer() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  gestureRecognizer = await GestureRecognizer.createFromOptions(
    vision,
    {
      baseOptions: {
        modelAssetPath: "/models/gesture_recognizer.task",
      },
      runningMode: "VIDEO",
      numHands: 1,
    }
  );
}

export function recognizeGesture(video, timestamp) {
  if (!gestureRecognizer) return null;
  return gestureRecognizer.recognizeForVideo(video, timestamp);
}

