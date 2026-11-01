---
name: launch-studio-film
description: Launch Studio Remotion launch films — GrammarFilm mix, VO sync, SFX, music. Use when editing launch-studio videos, film.json, voiceover, GrammarFilm, or Grafics/product launch MP4s in this repo. Do not route to HyperFrames.
---

# Launch Studio film (this repo)

This project is **Remotion** (`src/remotion/grammar/`). HyperFrames is a different engine — do not port or rewrite films as HTML compositions unless the user explicitly asks.

Engine API details live in project Remotion skills (taste-neutral). Load them, then apply the mix rules below.

| Need | Load |
| --- | --- |
| Delay, trim, volume, ducking | `.agents/skills/remotion-markup/audio.md` |
| Per-scene TTS + duration | `.agents/skills/remotion-markup/voiceover.md` |
| SFX | `.agents/skills/remotion-markup/sfx.md` |
| Scene cuts | `.agents/skills/remotion-markup/transitions.md` |
| Voice casting / line writing | `~/.claude/skills/launch-video-voice/SKILL.md` |

## Mix (non-negotiable)

- **Per-scene VO**, never one `voFull` from frame 10. Each clip starts after the picture is readable (`VO_IN` in `Film.tsx`).
- Editorial cream → **Kore** (user rejected Puck Jul/Aug 2026). Dark terminal → Charon.
- `loop={false}` on every Audio. Sequence `durationInFrames` = clip length, never the leftover scene — leftover Sequence time is what made lines repeat.
- Reject TTS takes longer than ~0.42s/word (Gemini restates the line). Do not atempo a double-read into the window.
- Default `sfx: false` on launch films until mix is tasteful. No cut whooshes.
- Music: pulse/heavy/adrenaline **synth beds** in `public/audio/music/beds/`. Never reuse another product's Lyria track (they read as lounge jazz under VO).
- Duck music to ~0.08 while VO is up; fade in/out 20–30 frames. No 120bpm volume pump on a full mix.
- Cuts are **hard**. One quiet switch/whip per cut (~0.28). No whoosh + hat + kick + boom stack. No PixelWipe.
- SFX only where the picture makes the sound (keyticks while typing, one enter, one hero impact). Taste-neutral Remotion meme SFX (`bruh`, `vine-boom`) are banned in launch films.

## Pipeline

`ingest` → `storyteller` → `director` → `TTS_VOICE=Kore node scripts/voiceover.mjs <domain>` → render `GrammarFilm` with `--props=runs/<domain>/film.json`.
