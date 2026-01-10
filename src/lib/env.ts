export type ServerEnv = {
  GEMINI_API_KEY?: string;
  ELEVENLABS_API_KEY?: string;
  ELEVENLABS_VOICE_ID?: string;
};

export function getServerEnv(): ServerEnv {
  // Intentionally minimal; implement validation later.
  return {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
    ELEVENLABS_VOICE_ID: process.env.ELEVENLABS_VOICE_ID
  };
}
