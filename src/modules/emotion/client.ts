import * as faceapi from 'face-api.js';

let modelsLoaded = false;

export async function loadEmotionModels(): Promise<void> {
  if (modelsLoaded) return;

  const MODEL_URL = '/models/face-api';
  
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
    ]);
    modelsLoaded = true;
    console.log('Face-api.js models loaded successfully');
  } catch (error) {
    console.error('Failed to load face-api.js models:', error);
    throw error;
  }
}

export interface EmotionResult {
  emotion: 'Neutral' | 'Happy' | 'Sad' | 'Angry';
  confidence: number;
}

// Map face-api.js emotions to our simplified emotion set
function mapEmotionToLabel(expressions: faceapi.FaceExpressions): EmotionResult {
  const emotions = {
    happy: expressions.happy,
    sad: expressions.sad,
    angry: expressions.angry,
    neutral: expressions.neutral,
    surprised: expressions.surprised,
    disgusted: expressions.disgusted,
    fearful: expressions.fearful
  };

  // Find the highest confidence emotion
  const highestEmotion = Object.entries(emotions).reduce((max, [key, value]) =>
    value > max.value ? { key, value } : max
  , { key: 'neutral', value: 0 });

  // Map to our simplified set
  let mappedEmotion: 'Neutral' | 'Happy' | 'Sad' | 'Angry';
  
  if (highestEmotion.key === 'happy' || highestEmotion.key === 'surprised') {
    mappedEmotion = 'Happy';
  } else if (highestEmotion.key === 'sad' || highestEmotion.key === 'fearful') {
    mappedEmotion = 'Sad';
  } else if (highestEmotion.key === 'angry' || highestEmotion.key === 'disgusted') {
    mappedEmotion = 'Angry';
  } else {
    mappedEmotion = 'Neutral';
  }

  return {
    emotion: mappedEmotion,
    confidence: highestEmotion.value
  };
}

export async function detectEmotion(videoElement: HTMLVideoElement): Promise<EmotionResult> {
  if (!modelsLoaded) {
    await loadEmotionModels();
  }

  try {
    const detection = await faceapi
      .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceExpressions();

    if (!detection) {
      return { emotion: 'Neutral', confidence: 0.0 };
    }

    return mapEmotionToLabel(detection.expressions);
  } catch (error) {
    console.error('Error detecting emotion:', error);
    return { emotion: 'Neutral', confidence: 0.0 };
  }
}
