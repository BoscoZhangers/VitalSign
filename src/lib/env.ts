export type ServerEnv = {
  COHERE_API_KEY?: string;
  COHERE_MODEL?: string;
  ELEVENLABS_API_KEY?: string;
  ELEVENLABS_VOICE_ID?: string;
};

export function getServerEnv(): ServerEnv {
  // Intentionally minimal; implement validation later.
  return {
    COHERE_API_KEY: process.env.COHERE_API_KEY,
    COHERE_MODEL: process.env.COHERE_MODEL,
    ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
    ELEVENLABS_VOICE_ID: process.env.ELEVENLABS_VOICE_ID
  };
}
