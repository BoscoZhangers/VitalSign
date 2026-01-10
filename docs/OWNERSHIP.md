# Ownership map

This file is here to keep 4 parallel branches from stepping on each other.

## Modules

- **Vision (MediaPipe + intensity score)**
  - `src/modules/vision/**`
  - Primary outputs: `GestureToken[]`, `intensity: number`

- **AI Refine (Gemini)**
  - `src/modules/gemini/**`
  - `src/app/api/refine/**`
  - Primary output: `{ text, tone }`

- **Voice (ElevenLabs)**
  - `src/modules/elevenlabs/**`
  - `src/app/api/speak/**`
  - Primary output: audio bytes/stream

- **UI / App glue**
  - `src/app/**`
  - `src/ui/**`
  - Primary output: working demo flow
