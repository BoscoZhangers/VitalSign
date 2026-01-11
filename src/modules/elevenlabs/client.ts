"use client";

/**
 * Browser-native audio playback function
 * Plays audio from ArrayBuffer using HTML5 Audio API
 */
async function playAudioInBrowser(audioBuffer: ArrayBuffer): Promise<void> {
  const blob = new Blob([audioBuffer], { type: "audio/mpeg" });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);

  return new Promise((resolve, reject) => {
    audio.onended = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    audio.onerror = (error) => {
      URL.revokeObjectURL(url);
      reject(error);
    };
    audio.play().catch(reject);
  });
}

/**
 * Simple function that takes text and automatically plays it using ElevenLabs REST API
 * Uses direct fetch instead of SDK to avoid Node.js dependencies
 * @param text - The text to convert to speech and play
 * @param voiceId - Optional voice ID (defaults to girl voice)
 */
export async function speakText(text: string, voiceId?: string): Promise<void> {
  // Use NEXT_PUBLIC_ prefix because this runs in the browser (client-side)
  const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    throw new Error(
      "ELEVENLABS_API_KEY not configured. Please set NEXT_PUBLIC_ELEVENLABS_API_KEY in your .env.local file"
    );
  }

  // Default to girl voice if not provided
  const selectedVoiceId = voiceId || "kdmDKE6EkgrWrrykO9Qt";
  const apiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Accept": "audio/mpeg",
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
    },
    body: JSON.stringify({
      text: text.trim(),
      model_id: "eleven_v3",
      voice_settings: {
        stability: 0,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} - ${errorData}`);
  }

  const audioBuffer = await response.arrayBuffer();

  // Play using browser-native audio playback
  await playAudioInBrowser(audioBuffer);
}
