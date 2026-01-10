# VitalSign (EmotiSign MVP)

Web app scaffold for an accessibility tool that translates sign + emotional intent into expressive speech.

This repo is intentionally just a **file outline** (no full implementation yet).

## Team ownership (suggested)

- Vision (MediaPipe + intensity): `src/modules/vision/**`
- AI refine (Gemini): `src/modules/gemini/**` + `src/app/api/refine/**`
- Voice (ElevenLabs): `src/modules/elevenlabs/**` + `src/app/api/speak/**`
- UI / integration: `src/ui/**` + `src/app/**`

## Env vars

See `.env.example`.
