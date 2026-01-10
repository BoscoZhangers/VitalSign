export type SessionState = {
  rawText: string;
  intensity: number;
};

export const initialSessionState: SessionState = {
  rawText: "",
  intensity: 0
};
