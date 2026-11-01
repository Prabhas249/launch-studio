---
name: launch-studio-film
description: Launch Studio Remotion launch films — GrammarFilm mix, VO sync, SFX, music. Use when editing launch-studio videos, film.json, voiceover, GrammarFilm, or Grafics/product launch MP4s in this repo. Do not route to HyperFrames.
---

# Launch Studio film (this repo)

This project is **Remotion** (`src/remotion/grammar/`). HyperFrames is a different engine — do not port or rewrite films as HTML compositions unless the user explicitly asks.

Engine API details live in project Remotion skills (taste-neutral). Load them, then apply the mix rules below.

| Need | Load |
| --- | --- |
| Delay, trim, volume, ducking | `../remotion-markup/audio.md` |
| Per-scene TTS + duration | `../remotion-markup/voiceover.md` |
| SFX | `../remotion-markup/sfx.md` |
| Scene cuts | `../remotion-markup/transitions.md` |
| Voice casting / line writing | `~/.claude/skills/launch-video-voice/SKILL.md` |

## Mix (non-negotiable)

- **Per-scene VO**, never one `voFull` from frame 10. Each clip starts after the picture is readable (`VO_IN` in `Film.tsx`).
- Editorial cream → **Puck**. Dark terminal → Charon. Kore only if the user asks for a female read.
- Music: pulse/heavy/adrenaline **synth beds** in `public/audio/music/beds/`. Never reuse another product's Lyria track (they read as lounge jazz under VO).
- Duck music to ~0.08 while VO is up; fade in/out 20–30 frames. No 120bpm volume pump on a full mix.
- Cuts are **hard**. One quiet click/swipe per cut (~0.28). No whoosh + hat + kick + boom stack. No PixelWipe.
- SFX only where the picture makes the sound (keyticks while typing, one enter, one hero impact). Taste-neutral Remotion meme SFX (`bruh`, `vine-boom`) are banned in launch films.

## Pipeline

`ingest` → `storyteller` → `director` → `TTS_VOICE=Puck node scripts/voiceover.mjs <domain>` → render `GrammarFilm` with `--props=runs/<domain>/film.json`.
