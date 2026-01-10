export type ToneTag = "Neutral" | "Calm" | "Happy" | "Sad" | "Angry" | "Urgent";

export type GestureToken = {
  token: string;
  confidence?: number;
};

export type RefineRequest = {
  rawText: string;
  intensity: number; // 0-100
};

export type RefineResponse = {
  text: string;
  tone: ToneTag;
};

export type SpeakRequest = {
  text: string;
  tone: ToneTag;
};
