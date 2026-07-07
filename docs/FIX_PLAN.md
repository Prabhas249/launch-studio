Now I have a complete picture of the codebase. Here is THE FIX PLAN.

---

# THE FIX PLAN

## 1. TTS Verdict

**Provider: Stay on Gemini. Switch voice and direction format.**

The announcer voice is not Gemini's fault — it is caused by two things you control: (a) emotional-label direction strings in `voiceover.mjs` and (b) promotional-register VO text written by `director.mjs`. Switching to ElevenLabs does not fix either. Fix both at source first; switch providers only if the result is still unacceptable after that.

**Voice: Charon for all stylePackss.**

Current code branches Puck (cream) vs. Charon (dark). Puck is described as "upbeat and versatile" — that is the announcer voice by design. Charon's "dark, atmospheric" label sounds wrong for cream styles but in practice delivers the measured, credible register you need. Japanese comparative testing (tsukubalab, N=30 voices) confirmed low-pitched voices resist announcer prosody regardless of script content. Remove the stylePack branch; hardcode Charon.

**Exact TTS prompt template (replaces the DIRECTION object and the prompt concatenation in `voiceover.mjs`):**

The current broken pattern (`${PROFILE} ${direction} Say exactly this:`): all of it goes into a single `contents` part, which the model treats as one continuous instruction. The fix is to move the structured direction into `systemInstruction` and put only the transcript in `contents`. Gemini treats `systemInstruction` as the persistent character context and `contents` as the utterance to perform — this is the correct separation.

```js
// Replace DIRECTION object + tts() function with this:

const AUDIO_PROFILE = `A confident, thoughtful narrator — sounds like a person who genuinely understands what they're describing, not someone reading a script.`;

const SCENE_CONTEXT = {
  COLD_OPEN: {
    situation: `You're describing a problem you personally lived with. Not dramatizing it — just noting the obvious absurdity of how things worked before.`,
    style: `Dry recognition. Like saying 'turns out the way everyone was doing this was kind of insane.'`,
    pacing: `Unhurried. The tension is in the observation, not the delivery speed.`
  },
  PAIN_TYPOGRAPHY: {
    situation: `You're recounting the old way for someone who already knows the pain. They already agree. You're just listing it flatly.`,
    style: `Matter-of-fact, slightly tired. Not whiny, not dramatic.`,
    pacing: `Clipped. Short pauses between items. No vocal energy.`
  },
  PRODUCT_HERO: {
    situation: `You just watched someone try this for the first time. The demo took 30 seconds. They got it. You're telling a colleague about it over coffee. Not performing.`,
    style: `Understated confidence. The product earns the response; you don't manufacture it.`,
    pacing: `Conversational. One short breath before the product name. No pitch rise at end of sentence.`
  },
  FEATURE_WALK: {
    situation: `You're walking someone through something you've used before. You know where to click. You're describing steps, not performing a demo.`,
    style: `Practical, informative. Narrating a screen recording for a colleague.`,
    pacing: `Even. Brief pause between steps.`
  },
  STAT_CALLOUT: {
    situation: `You're reporting a fact you are mildly proud of. You have the data. Not selling — citing.`,
    style: `Calm, slight satisfaction — like reporting a fact you are proud of.`,
    pacing: `[slowly] on the number. Natural pause after it.`
  },
  CTA_COMPRESSION: {
    situation: `Small demo call with two people, not a stage. You're suggesting something quietly because you're confident it's worth their time.`,
    style: `Soft suggestion, like someone who has already seen how this ends.`,
    pacing: `Slow slightly on the domain name. No urgency.`
  }
};

function buildSystemInstruction(sceneType) {
  const s = SCENE_CONTEXT[sceneType] || SCENE_CONTEXT.COLD_OPEN;
  return `## AUDIO PROFILE\n${AUDIO_PROFILE}\n\n## THE SCENE\n${s.situation}\n\n### DIRECTOR'S NOTES\nStyle: ${s.style}\nPacing: ${s.pacing}\n\nSpeak ONLY the lines under #### TRANSCRIPT. Nothing else.\n\n#### TRANSCRIPT`;
}

async function tts(text, sceneType, sceneIdx) {
  const systemText = buildSystemInstruction(sceneType);
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemText }] },
            contents: [{ parts: [{ text: text }] }],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Charon" } } },
            },
          }),
        }
      );
      // ... rest of retry logic unchanged
    }
  }
}
```

**Cost math per 30s video (6 scenes, ~350 chars total VO):**

| Provider | Model | Per video | Per 100 videos/mo |
|---|---|---|---|
| Gemini (prototype) | 2.5-flash-preview-tts | ~$0.002 | ~$0.19 |
| Gemini (production) | 3.1-flash-tts | ~$0.015 | ~$1.50 |
| ElevenLabs | eleven_v3 + Brian voice | ~$0.035 | ~$3.50 |
| OpenAI | gpt-4o-mini-tts-2025-03-20 | ~$0.0075 | ~$0.75 |

Stay on Gemini 3.1 Flash TTS for production. If after the direction fix the voice still sounds promotional, the next trial is ElevenLabs Brian (nPczCjzI2devNBz1zQrb), `stability: 0.50`, `similarity_boost: 0.75`, `style: 0`, `mode: Natural`.

---

## 2. The Storyteller Agent

**Problem:** `director.mjs` writes the `vo` field while simultaneously holding brand strategy, positioning instructions, and art direction in the same context window. Marketing brain dominates. The output is promotional copy with contractions, not narration. Moving the prompt around does not fix this — the semantic content of the words overrides the delivery direction in TTS.

**Fix:** Create `scripts/storyteller.mjs`. Reads `factsheet.json`. Writes `story.json`. The art director and VO layer are downstream consumers of story.json and cannot modify `vo_line`, `word_count`, or `quality_checks`.

**Full system prompt (paste verbatim as the `systemInstruction` for `storyteller.mjs`, temperature 0.7):**

```
You are a narrative strategist and script writer for 30-second editorial launch videos for B2B SaaS products. Your only job is story and language. You receive a crawled FACTSHEET and output structured narrative JSON. You do NOT decide visual effects, typography, transitions, music, or voice — those belong to downstream agents.

## PHILOSOPHY

The buyer's current workflow is the villain. Never a competitor, never a person — an abstract force with a name you invent: 'The Compliance Panic', 'The Attribution Fog', 'Manual Research Hell'. The buyer is the hero. The product is the tool. Never put the product on a pedestal.

The product name does NOT appear in scenes 1 or 2. The hook must earn attention before introducing the product.

Narration quality test — every vo_line must pass this: could a calm, intelligent person say this mid-conversation without sounding like they're presenting? If you write an exclamation point: delete and rewrite. If you write 'revolutionary', 'seamless', 'powerful', 'game-changing', or 'AI-powered': delete and replace with what physically happens instead.

Cognitive chemistry by scene:
- S1-S2: Cortisol. Mirror the buyer's reality without naming the problem yet. Create recognition, not explanation.
- S3: Oxytocin. The human cost — who suffers, what it feels like, not what it costs in dollars.
- S4: Dopamine onset. The product appears as a tool, the buyer as the hero who uses it.
- S5: Dopamine payoff. One concrete number or observable transformation. No adjectives.
- S6: Trust close. The new normal. Suggest, do not demand. No urgency language.

## FORMULA SELECTION

Choose ONE formula and commit. Do not blend.

PAS (Problem-Agitate-Solve): Painkiller products. Buyer already knows they have a problem. They are frustrated, not aspirational.
BAB (Before-After-Bridge): Aspirational products. Buyer is growth-minded, not in crisis.
VILLAIN (Named antagonist + old-way vs new-way): Category creation or paradigm shift. The villain is an abstract force you name.
CONTRAST (Direct workflow replacement): A specific legacy tool or process is being replaced and the audience is already considering switching.

Selection heuristic: painkiller + known problem = PAS; vitamin + aspiration = BAB; category creation + no direct incumbent = VILLAIN; clear legacy tool being replaced = CONTRAST.

## WORD BUDGETS (HARD LIMITS)

At 150 WPM nominal, natural TTS prosody runs approximately 130 WPM effective.
S1 (4s): 8 words max
S2 (4s): 8 words max
S3 (6s): 13 words max
S4 (8s): 17 words max
S5 (4s): 8 words max
S6 (6s): 13 words max
Total: 67 words for the entire 32-second video.

Count words before finalizing every scene. If over budget, cut — do not paraphrase into longer sentences.

## FEW-SHOT EXAMPLES

### Scene 1 Hook (4s, 8 words max)

BAD: vo_line 'Managing customer feedback has never been harder.' — unverifiable generic claim, duplicates theme, 'serious urgent' has no sensory referent.

GOOD: vo_line 'Monday morning. Forty-two tabs. One question unanswered.' / on_screen_text 'Week 3 of the same problem.' / vo_direction 'quiet, a little tired, like confessing something obvious' — specific, visual, recognizable; on-screen adds different information.

### Scene 4 Solution Reveal (8s, 17 words max)

BAD: vo_line 'Our platform uses powerful AI to automatically analyze your customer conversations and surface key insights instantly!' — hollow, exclamation triggers rising intonation, on-screen repeats VO.

GOOD: vo_line 'It read twelve hundred conversations before your meeting started. You walked in knowing.' / on_screen_text '1,200 calls → 3 decisions' / vo_direction 'calm, slight satisfaction — like reporting a fact you are proud of' — 15 words on budget, buyer in the scene, on-screen shows data transformation.

### Scene 6 CTA (6s, 13 words max)

BAD: vo_line 'Sign up today and start your free trial — the future of customer research is here!' — broadcast CTA, exclamation, urgency.

GOOD: vo_line 'Your next decision is already in your calls. Go hear it.' / on_screen_text 'listenlabs.ai' / vo_direction 'soft suggestion, like someone who has already seen how this ends' — 12 words, reframes CTA as something buyer already wants.

## OUTPUT SCHEMA

Return ONLY valid JSON. No prose, no markdown fences.

{
  "positioning_insight": {
    "villain": "(string) Abstract force with a name you invented",
    "hook_angle": "(string) Non-obvious reframe — what changes in the buyer's world, not what the product does",
    "promised_land": "(string) Destination in buyer's language, not product marketing language"
  },
  "formula": {
    "selected": "(enum: PAS | BAB | VILLAIN | CONTRAST)",
    "rationale": "(string) 1-2 sentences: why this formula fits this specific product and buyer persona"
  },
  "scenes": [
    {
      "scene_id": "(integer 1-6)",
      "scene_type": "(enum: COLD_OPEN | PAIN_TYPOGRAPHY | PRODUCT_HERO | FEATURE_WALK | STAT_CALLOUT | CTA_COMPRESSION)",
      "duration_s": "(integer: 4, 4, 6, 8, 4, 6)",
      "word_budget_safe": "(integer: 8, 8, 13, 17, 8, 13)",
      "narrative_beat": "(string) The story job this scene does, in one clause",
      "vo_line": "(string) Exact spoken words, at or under word_budget_safe",
      "word_count": "(integer) Actual count of words in vo_line — must be <= word_budget_safe",
      "on_screen_text": "(string | null) COMPLEMENTS the VO with different information: a stat, a label, a brand reveal, a counterpoint. Max 4 words. Null if any text would repeat the VO.",
      "vo_direction": "(string) One phrase as a character/situation instruction — never a bare emotion word"
    }
  ],
  "total_words": "(integer) Sum of all scene word_counts — must be <= 67",
  "quality_checks": {
    "product_name_in_scenes_1_or_2": "(boolean — MUST be false)",
    "exclamation_marks_in_any_vo_line": "(integer — MUST be 0)",
    "superlatives_used": "(array of strings — MUST be [])",
    "any_on_screen_duplicates_its_vo": "(boolean — MUST be false)"
  }
}
```

**Art Director handoff contract:** The art director agent receives story.json and adds per scene: `visual_treatment`, `tts_style_prompt` (constructed from `vo_direction` + global voice persona), `asset_type` (enum: UI_screenshot | abstract_motion | typography_only | split_screen), `beat_alignment_bars`. It also adds a global `voice_persona` field. It CANNOT modify `vo_line`, `on_screen_text`, `word_count`, `total_words`, or `quality_checks`. The orchestrator schema-diffs art director output against story.json before rendering to enforce this.

---

## 3. Pipeline Architecture

**Final agent chain (all scripts in `scripts/`):**

```
ingest.mjs
  → factsheet.json

storyteller.mjs  (gemini-2.5-flash, temp 0.7)
  reads: factsheet.json
  writes: story.json
  contains: positioning_insight, formula, scenes[]{vo_line, word_count, quality_checks}

critic.mjs  (gemini-2.5-flash-lite, temp 0)
  reads: story.json + factsheet.json
  checks: banned words, word budgets, announcement openers, invented numbers
  output: {pass: bool, issues[{scene_id, problem, severity: block|warn}]}
  on fail: storyteller re-runs with issues[] injected (max 1 retry)
  cost: ~$0.002/run

[PARALLEL — no data dependency between these two]
art-director.mjs          vo-writer is folded into storyteller for now
  reads: story.json + factsheet.json
  adds: visual_treatment, screenshot keys, variants, stylePack, music
  cannot touch: vo_line, word_count
  writes: art.json

voiceover.mjs  (Gemini TTS, Charon voice, buildSystemInstruction per scene)
  reads: story.json (vo_line per scene_type)
  writes: public/vo/<domain>/scene_N.wav
  measures: actual_duration_s per WAV via ffprobe (see §4)
  writes: vo_manifest.json {scene_id, wav_path, actual_duration_s}

merge.mjs
  reads: art.json + story.json + vo_manifest.json
  writes: film.json (the Remotion input, with actual_duration_s per scene)

Remotion render
  durationInFrames = Math.ceil(scene.actual_duration_s * fps) per scene
  audio fade-out on last 12 frames, no hard clip
```

**Where critique happens:** After storyteller, before TTS. Text critique costs $0.002 and catches hypey language, word budget violations, and invented numbers deterministically. TTS costs $0.015 and cannot be un-spent. Never run critique after render.

**Backward-compatible migration path (do NOT rewrite director.mjs tonight):** On the first evening, run storyteller.mjs first, then pass its `vo_line` values into the existing director.mjs by injecting them as a `provided_vo` field in the user message. Director picks them up and uses them verbatim instead of writing its own. This unblocks the TTS quality fix without requiring a full pipeline refactor.

---

## 4. VO-Timing Solution

**Three-layer defense. Apply in this order:**

**Layer 1 (primary, zero cost): Write to safe word budgets.**
The storyteller enforces 67 words total at 130 WPM effective. At these budgets, a 4s scene gets 8 words (~3.7s of audio), leaving 0.3s slack. This eliminates most clip violations before TTS runs.

**Layer 2 (secondary, ~10 lines of code): Measure actual duration, let Remotion float.**

Add after each TTS → WAV conversion in `voiceover.mjs`:

```js
import { execFileSync } from 'node:child_process';

function measureWavDuration(wavPath) {
  const out = execFileSync('ffprobe', [
    '-v', 'quiet',
    '-show_entries', 'format=duration',
    '-of', 'csv=p=0',
    wavPath
  ]).toString().trim();
  return parseFloat(out); // seconds
}

// After writing scene_N.wav:
const actualS = measureWavDuration(wav);
const plannedS = scene.duration_s; // from story.json
const drift = actualS - plannedS;

let finalWav = wav;
if (drift > 0.8) {
  // Serious overrun — atempo compress (stay ≤15% to avoid artifacts)
  const rate = Math.min(1.15, actualS / plannedS);
  const compressed = wav.replace('.wav', '_c.wav');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', wav,
    '-filter:a', `atempo=${rate}`, compressed]);
  finalWav = compressed;
  scene.actual_duration_s = plannedS;
} else {
  // Minor drift — accept it, Remotion floats ±0.5s fine
  scene.actual_duration_s = actualS;
}
```

Write `actual_duration_s` into film.json per scene.

**In Remotion composition**, replace every hardcoded `durationInFrames` per scene:

```tsx
// Before (clips audio):
<Sequence durationInFrames={4 * 30}>

// After (audio-first):
const durationInFrames = Math.ceil(scene.actual_duration_s * fps);
<Sequence durationInFrames={durationInFrames}>
```

Use `parseMedia()` from `@remotion/media-utils` (not deprecated `getAudioDurationInSeconds`) if measuring inside the Remotion bundle:

```ts
import { parseMedia } from '@remotion/media-utils';
const meta = await parseMedia(staticFile(`vo/${domain}/scene_${i}.wav`));
const durationInFrames = Math.ceil(meta.durationInSeconds * fps);
```

**Layer 3 (tertiary, fade instead of hard cut):**

```tsx
<Audio
  src={staticFile(voTrack)}
  volume={(f) => interpolate(
    f,
    [durationInFrames - 12, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )}
/>
```

This replaces the current hard boundary with a 0.4s fade-out. Even if the word budget slightly overruns, the audio dissolves cleanly rather than chopping mid-syllable.

**atempo artifact ceiling:** Safe range is 0.9–1.1 (imperceptible), acceptable 0.8–1.2, noticeable warble at 1.3+. If the layer 1 word budgets are enforced, you will rarely need atempo above 1.1. If Rubberband is installed (`brew install rubberband`), use it instead of atempo for any compression above 1.15: `rubberband --tempo 1.15 --pitch 0 --quality s input.wav output.wav` — 40% fewer artifacts in the 1.2–1.5× range.

---

## 5. Lyria Music Integration

**Skip tonight. Here is the plan for the session after the VO fix.**

The music is not causing the "cheap ad" problem. The VO is. Do not touch the music pipeline until the voice quality is solved, or you will be debugging two variables simultaneously.

**When you do integrate Lyria:**

Model: `lyria-2` via Gemini API (available in AI Studio; Vertex AI for production). Cost: ~$0.003/second of generated audio → 32s track = ~$0.096.

Prompt patterns for each music type (write these to the `music` field, then Lyria generates a 32s loop):

- `pulse` (bright, friendly): `"Bright punchy electronic groove, 120 BPM, tight kick on every beat, crisp hi-hats, minimal melodic stabs on offbeats, clean professional mix, no vocals, loops cleanly at 16 bars"`
- `heavy` (dark, technical): `"Dark halftime beat, 120 BPM felt as 60, heavy 808 sub on beat 1, rimshot on beat 3, moody synth pad, lo-fi texture, no melodic development, consistent tension throughout, no vocals"`
- `adrenaline` (bold, fast): `"Driving 16th-note synth arpeggio, 128 BPM, punchy bassline, energetic build over 8 bars then drop, major key, clean modern electronic production, no vocals"`

The `gen-arranged.sh` file currently generates placeholder SFX via ffmpeg. Replace with a `gen-music.mjs` script: reads `film.json` for `stylePack` and `music` fields, calls Lyria API, writes `public/music/<domain>/main.mp3`.

---

## Build Order: One Evening Session (4 hours)

**Hour 1 — TTS direction fix (highest ROI, 0 new files):**
1. In `/Users/prabhas/dev/launch-studio/scripts/voiceover.mjs`: replace `DIRECTION` object with `buildSystemInstruction(sceneType)` function (code above)
2. Move prompt to `systemInstruction` field in the API body
3. Change VOICE default: remove stylePack branching, hardcode `"Charon"` everywhere
4. Run: `node scripts/voiceover.mjs leadverse.ai` → listen to all 6 clips
5. Compare the current `public/vo/leadverse.ai/` clips vs. new output

**Hour 2 — VO script quality (edit director.mjs, no new files):**
1. Remove Rule 4b from director.mjs (the narration/vo writing block)
2. Add word budget constraints per scene type to the SYSTEM prompt
3. Add one bad/good VO example pair per scene type directly in the prompt
4. Change the `vo` field instruction to: "Write the vo_line from this word budget table: COLD_OPEN 8 words, PAIN_TYPOGRAPHY 8, PRODUCT_HERO 13, FEATURE_WALK 17, STAT_CALLOUT 8, CTA_COMPRESSION 13. Use contractions. Present tense. No adjectives meaning quality. No exclamation marks."
5. Re-run director + voiceover → listen A/B

**Hour 3 — Duration measurement + audio-first Remotion:**
1. Add `measureWavDuration()` to voiceover.mjs using ffprobe
2. Add drift check + conditional atempo after each WAV write
3. Write `actual_duration_s` into film.json per scene
4. In `src/remotion/` composition files: replace hardcoded scene durations with `Math.ceil(scene.actual_duration_s * fps)`
5. Render a full video and confirm no clips

**Hour 4 — Create storyteller.mjs (production-quality VO going forward):**
1. Create `scripts/storyteller.mjs` with the full system prompt from §2
2. Wire: reads `factsheet.json` → writes `story.json`
3. Modify director.mjs to read `vo_line` from story.json via a `provided_vo` map keyed by `scene_type`, injected into the user message before the FACTSHEET block
4. Test end-to-end: `node scripts/storyteller.mjs leadverse.ai && node scripts/director.mjs leadverse.ai && node scripts/voiceover.mjs leadverse.ai`

**Defer to next session:** critic.mjs, art-director.mjs split, vo-writer.mjs as separate agent, Lyria music, ElevenLabs provider trial, `parseMedia()` Remotion upgrade.

---

**The single most important thing to do first:** Change `[excitement] This is the reveal — the lift moment. Pitch up, pace up, smile in the voice.` to the situational scene context format. That one change to `PRODUCT_HERO` in voiceover.mjs will audibly demonstrate the mechanism in 15 minutes. Everything else builds on that confirmation.