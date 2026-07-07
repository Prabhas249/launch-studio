# PRODUCTION_METHOD.md — Launch-Video Production Methodology

**Source:** Harvested from HeyGen's real HyperFrames launch-video projects
(`hyperframes-launch`, `website-to-hyperframes`, `timeline-launch`, `cloud-render-launch`,
`spacex-launch`, `sfx-music-launch`, `inspector-launch`, `variables-launch`). Every rule,
number, and quoted example below is distilled from shipped `SCRIPT.md`, `STORYBOARD.md`,
`HANDOFF.md`, and `frame.md`/`design.md` files that produced actual rendered MP4s.

**Purpose:** This is the operating manual for our two authoring agents:

- **Storyteller LLM** — takes the crawled URL + brief, produces `SCRIPT.md` (VO copy,
  word-count/duration math, silent beats, VO direction).
- **Art-Director LLM** — takes the script, produces `STORYBOARD.md` + `frame.md` (per-beat
  visual schema, palette, typography, motion, SFX, music/underscore direction).

Downstream: Gemini TTS speaks the script, Lyria scores the underscore, the renderer captures
HTML → MP4. This document gives both LLMs copy-paste-ready rules and templates so the output
lands in the same register HeyGen ships.

Everything in **§7** is prompt-fragment text you can paste directly into system prompts.

---

## Table of contents

1. Script structure + word-count→duration math + planned silent-beat format
2. VO-direction-as-a-character templates
3. Music / underscore direction templates
4. Per-beat storyboard field schema
5. Global design guardrails
6. The SCRIPT.md / STORYBOARD.md / HANDOFF.md doc-trio templates
7. Copy-paste prompt fragments for the storyteller & art-director system prompts

---

# 1. Script structure + word-count→duration math + planned silent beats

## 1.1 The core numbers (measured, not guessed)

These ratios come straight from shipped scripts. Use them as the calculator inside the
storyteller.

| Metric | Measured value | Source |
|---|---|---|
| Words per finished minute (keynote cadence, with pauses) | **~110 words ≈ 50–55s spoken; ~58–62s total with 2 silent beats** | hyperframes-launch `SCRIPT.md` |
| Prior draft that was **too dense** | ~140 words for the same 60s slot | hyperframes-launch v2 (cut to v3) |
| Voice time as a fraction of runtime | **~21s of voice in a ~50s film** (rest is music + visual-only) | website-to-hyperframes `SCRIPT.md` |
| Single capability label ("CSS animations.") | 2.0–2.5s slot each | hyperframes flex section |
| One-word beat ("Lottie.", "Shaders.") | 0.67–1.2s master slot | hyperframes `HANDOFF.md` |
| CTA line ("Give your agent the skill…") | 4.5–6.0s across 3 sub-beats | multiple |

**The rule of thumb the storyteller must apply:**

> **~2.2 spoken words per second at keynote cadence.** A 30s film = **~55–70 spoken words
> MAX**, and you will usually want *fewer* because silent beats and music-only stretches eat
> real time. Always budget voice at **40–50% of runtime**, never 100%.

Worked example, verbatim from hyperframes-launch v3 `SCRIPT.md`:

> "Spoken v3: ~110 words. v2 was ~140 words. Expected spoken duration ~50–55s at Apple-keynote
> cadence. With the ~3s motion-montage gap and the A-roll gap added back in, total runtime
> lands roughly in the 58–62s range — same neighborhood as v2, but with a tighter cold open and
> no contrast beat."

The lesson that recurs across every project: **cutting words buys time and impact.** The v2→v3
rewrite literally logged this against the contrast beat:

> | 7 contrast | "No new framework for the agent to learn…" | **CUT ENTIRELY.** ~6.4s freed. |

Treat freed seconds as a feature.

## 1.2 The script file has TWO separate blocks — never merge them

The single most important structural rule, stated verbatim in hyperframes `SCRIPT.md`:

> **Spoken VO.** Spoken lines only. No inline directions, no emphasis markdown, no author
> notes. This block is what feeds ElevenLabs verbatim.

Our pipeline feeds Gemini TTS, so the same rule holds: **the spoken block must be clean text
that can be pasted straight into the TTS call.** Directions, emphasis asterisks, and `[pause]`
markers live in a *separate* section.

Here is a real, complete clean spoken block (hyperframes v3) — note zero markup:

```
Imagine you could make videos like this.

Your agent already can — just give it HyperFrames.

Open source. HTML in, video out.

CSS animations. G-Sap. Lottie. Shaders. Three.js.

A div is a keyframe. Data attributes are your timeline.
CSS is your look. JavaScript is your animation engine.

Anything a browser can render can be a frame in your video.

Drop in music, sound effects, footage — it all composes together.

Your agent writes code to compose. HyperFrames renders every frame to MP4.
It's deterministic, pixel-perfect, every time.

Give your agent the skill. Tell it what to make. Watch it build.

HyperFrames. Go make something.
```

Real cleanups the HeyGen team logged when going draft → final — each is a bug our storyteller
must never emit (verbatim from the `## Changes vs. Jake's draft` table):

| Draft artifact | Fix | Why |
|---|---|---|
| `"CSS animations (update). GSAP…"` | drop `(update)` | "(update)" was an author note. Dropped. |
| `"***Drop in music, sound effects***, footage"` | strip `***` | "Asterisks were markdown emphasis. Stripped. Emphasis goes into delivery." |
| `"Your Agent already can"` | lowercase "agent" | "Lowercase 'agent' for consistency." |
| `"renders every frame into MP4"` | `to MP4` | "*to* is more idiomatic than *into* for single-format output." |
| `"pixel perfect"` | `pixel-perfect` | "Compound adjective, hyphenated." |

## 1.3 Pronunciation cues are a THIRD, separate block

TTS mangles acronyms and product names. HeyGen keeps a dedicated cue list, never inlined into
the spoken block (except where the cue IS the spelling, e.g. writing "G-Sap" in the spoken
text). Verbatim from hyperframes `## Pronunciation cues for VO generation`:

> - **HyperFrames** — pronounced *hyper-frames*, not *hyper* then *frames* spelled out. The
>   camelCase is a typographic choice, not a pronunciation cue. Expect ElevenLabs to handle it
>   as a single compound word.
> - **GSAP** — pronounced *G-Sap* (rhymes with *snap*). Already inlined as "G-Sap" in the
>   spoken block above for TTS.
> - **Three.js** — pronounced *three dot J-S*.
> - **MP4** — pronounced *M-P-four*.

More from website-to-hyperframes:

> - `URL` → *U R L* (three letters)
> - `SVG` → *S V G* (three letters, spaces force spell-out)
> - `3D` → *three D*

**Storyteller rule:** for every acronym, camelCase name, file extension, or number-in-copy in
the spoken block, emit a pronunciation cue line. When the fix is a respelling ("G-Sap"), put
the respelling directly in the spoken block AND note it in the cue list.

## 1.4 Planned silent beats — the format

Silence is scripted, not accidental. hyperframes `SCRIPT.md` has an explicit
`## Silent visual beats (not spoken)` section. Verbatim format:

> The VO leaves room for two silent gaps where the picture carries the moment. Not part of the
> ElevenLabs input — handled by Phase 3 timeline sequencing.
>
> 1. **After "Imagine you could make videos like this."** — ~3s silent beat. Super-tight
>    motion-graphics montage (existing flex reel content smashed together as a teaser before
>    the product is named).
> 2. **After "Open source. HTML in, video out."** — A-roll beat with composition overlay
>    (creator on camera + lower third / captions / waveform).

In the shipped VO the gap was baked into the audio file itself — from the `HANDOFF.md` audio
table:

> `#voiceover` | `voiceover_v3_gap.mp3` | 0.00–49.76 | 1.0 | **v3 VO with 1s silent gap at ~3s
> for intro montage**

website-to-hyperframes takes it further — **entire acts are VO-free** (verbatim from Act 2):

> **No VO.** Music carries the full energy. Only on-screen monospace labels… These fade in/out
> sync'd to extraction beats — the visual *is* the story. **Narration here would be
> over-explaining.**

**Storyteller rules for silent beats:**
- A silent beat is a numbered entry with **(a)** the anchor ("After '…'") and **(b)** what the
  picture does during the gap.
- Mark whether the gap is **inside the audio file** (a real pause the TTS should render) or
  **between clips** (sequencer-inserted). Our pipeline: prefer sequencer gaps; keep the TTS
  output tight.
- Budget silent beats INTO the duration math. A 30s film with two 2s silent beats has only
  ~26s left for voice + visual-with-voice.
- Default: **at least one silent beat per ~20s of runtime.** "Silence between sentences is a
  feature" (see §2).

## 1.5 `[pause]` markers inside the storyboard's script copy

When a pause lives inside the flow (not a full montage gap), HeyGen writes it as an inline
`[pause]` token in the *storyboard's* script block — never in the clean TTS block. Verbatim
from hyperframes STORYBOARD's `## Script` section:

```
This is Hyperframe. Open source. HTML in, video out.

A div is a keyframe. Data attributes are your timeline.
CSS is your look. GSAP is your animation engine.

Anything a browser can render becomes a frame in your video.

[pause]

CSS animations. GSAP. Lottie. Shaders. Three.js.
```

**Rule:** `[pause]` is a director's note for pacing/sequencing. The clean TTS block gets a
paragraph break or a period instead; the sequencer inserts real dead time.

## 1.6 Line-per-beat granularity for montages

For fast montages, the script is written as **one short label per clip**, each with its own
timecode and its own generated audio file. website-to-hyperframes Act 3 is the model
(verbatim):

```
### Line 6 — Stripe opener (30.0 – 31.5s · 1.5s)
Product launches.

### Line 7 — Tailwindcss 6-scene rapid-fire (31.5 – 35.0s · 3.5s)
Feature showcases.

### Line 8 — Framer holo-gradient (35.0 – 38.0s · 3.0s)
Brand reels.
```

Each line → its own file, named `NN-slug.mp3`:

> `06-product-launches.mp3`, `07-feature-showcases.mp3`, `08-brand-reels.mp3`, …

This lets the sequencer place each label precisely against its clip. **Our pipeline:** one
Gemini TTS call per montage label, named `NN-slug.mp3`, so the model resets prosody per label.

## 1.7 Multi-act cold-open structure (the recurring shape)

website-to-hyperframes and cloud-render both use a **before-after-bridge** arc. The story-shape
is stated explicitly (cloud-render `## Story shape`, verbatim):

> **Archetype:** Before-After-Bridge — local render crawls at 1% on your machine → *don't get
> blocked by your machine* → connect HeyGen, fire all projects → cloud fleet finishes
> everything.
> **Hook:** pain validation in a real Claude Code chat (the absurd 1% / ~15 min answer).

The cold-open device that repeats: **a question stack.** website-to-hyperframes opens with four
one-line questions under four typing panels — "Promo for your app?", "Brand video?",
"Social ad?", "Launch clip?" — then an announcement drop: "Now — any site becomes video."

**Storyteller rule:** default arc for a product launch is **Hook (pain or question) → Turn
(the product named) → Proof (capability reel) → CTA (calm sign-off).** Name the archetype at
the top of the script so the art-director inherits it.

---

# 2. VO-direction-as-a-character templates

HeyGen never writes "read this in a nice voice." They write a **character brief** — a named
energy, a register, and a rule about restraint. This is the single most transferable technique.

## 2.1 The canonical brief (quote it, adapt the noun)

From hyperframes `STORYBOARD.md`, verbatim — this is the template to imitate:

> **VO direction:** Mid-age male, calm confident delivery. Apple keynote presenter register —
> **Craig Federighi energy without the jokes.** Economy of words. **Silence between sentences
> is a feature. Every word earns its place.**

Four ingredients, always present:
1. **Casting** — age/gender/timbre ("Mid-age male, calm confident").
2. **A named human reference** — "Craig Federighi energy without the jokes."
3. **A cadence philosophy** — "Economy of words."
4. **A restraint rule** — "Silence between sentences is a feature. Every word earns its place."

## 2.2 Per-act / per-line delivery direction

For films with emotional range, HeyGen writes delivery per line. website-to-hyperframes
`SCRIPT.md`, verbatim global brief:

> **Voice direction:** Curious, playful on Act 1 questions. Confident and slightly smiling on
> the Act 1 announcement. Rhythmic, punchy, trailer-cadence on the Act 3 capability listing.
> Calm + warm on the Act 4 CTA. **Always feels like a person, never like a reader.**

And then per line, verbatim:

> - Line 1 — *"Promo for your app?"* — **Delivery:** Upward lilt at the end — genuine curiosity.
> - Line 5 — *"Now — any site becomes video."* — **Delivery:** Drop into confidence. Period
>   after "Now" creates a beat. "any site" gets gentle emphasis. **Ends with a slight smile the
>   listener can hear.**
> - Line 17 — *"HyperFrames."* — **Delivery:** "HyperFrames" as ONE compound word — not *Hyper*
>   then *Frames*. Slight stress on the first syllable.
> - Line 19 — *"Go make something."* — **Delivery:** Slight smile in voice. Warm, confident,
>   not sales-y.

## 2.3 The character-brief template (fill-in-the-blanks)

```
**VO direction (global):**
[CASTING: age / gender / timbre — e.g. "Mid-age male, calm confident delivery"].
[NAMED REFERENCE: a real presenter/actor + a subtractive qualifier — e.g.
"Craig Federighi energy without the jokes" / "trailer-VO cadence without the cheese"].
[CADENCE PHILOSOPHY: e.g. "Economy of words." / "Rhythmic, punchy, period-stopped."].
[RESTRAINT RULE: e.g. "Silence between sentences is a feature. Every word earns its place."
/ "Always feels like a person, never like a reader."].

**Per-beat delivery:**
- Line N — "[quote]" — [emotional register] + [one micro-direction: where the beat lands,
  which word gets the stress, what the mouth is doing — "ends with a smile the listener
  can hear"].
```

## 2.4 A library of named references (harvested + extensible)

Use a real, specific human/aesthetic. Never "professional narrator." Proven ones:

- **"Apple keynote presenter register — Craig Federighi energy without the jokes."** (product,
  confident, dry)
- **"Rhythmic, punchy, trailer-cadence"** — for the capability listing (montage, escalation)
- **"Curious, playful … genuine curiosity, upward lilt"** (question hooks / cold opens)
- **"Calm + warm … slight smile the listener can hear, not sales-y"** (CTA / sign-off)

Extend the library with the same shape: `[real reference] + [subtractive qualifier]`. The
subtractive qualifier ("without the jokes", "not sales-y", "never like a reader") is what keeps
Gemini TTS from overacting.

## 2.5 Map the brief to actual Gemini TTS controls

Our TTS is Gemini, not ElevenLabs — but keep the ElevenLabs-style settings block in the script
for provenance, then translate. website-to-hyperframes recorded, verbatim:

> **Voice:** ElevenLabs — Rachel (`21m00Tcm4TlvDq8ikWAM`)
> **Voice settings:** stability 0.35 · similarity 0.75 · style 0.20 · speaker boost: on
> **Model:** `eleven_multilingual_v2`

**Translation guidance for the storyteller (Gemini TTS):**
- "Economy of words / silence is a feature" → lower speaking rate, natural pauses; do NOT ask
  TTS to fill gaps.
- "Curious, upward lilt" → set the style prompt to a question read; keep stability lower so the
  inflection survives.
- "Trailer-cadence, period-stopped" → short single-clause lines, hard periods; render each
  montage label as its own TTS call so the model resets prosody per label.
- Always emit the delivery direction as the TTS **style prompt** for that line. (See the
  `launch-video-voice` skill for the exact Gemini voice + audio-tag catalog.)

---

# 3. Music / underscore direction templates

Music is directed as precisely as voice: a **reference artist**, a **section-by-section
dynamics map**, and **ducking specs in dB**. Never "add background music."

## 3.1 The underscore brief (quote it)

hyperframes `STORYBOARD.md`, `## Underscore Direction`, verbatim — the template:

> **Minimal electronic.** A warm sustained pad **already playing when the video starts — no
> silence-to-sound transition.** Sits underneath everything, never competing with VO. **Swells
> gently during the flex section (0:24–0:38), drops to near-nothing for the comparison beat,
> resolves on a final chord at close.** Reference vibe: **Tycho's ambient work, the softer end
> of Jon Hopkins.** Not trailer music. Not corporate stock.

Ingredients, always present:
1. **Genre + texture** — "Minimal electronic … warm sustained pad."
2. **Entry rule** — "already playing when the video starts — no silence-to-sound transition."
3. **Section-mapped dynamics with timecodes** — "Swells 0:24–0:38, drops for the comparison
   beat, resolves on a final chord at close."
4. **Named artist references** — "Tycho … the softer end of Jon Hopkins."
5. **Negative references** — "Not trailer music. Not corporate stock."

In the shipped film the underscore is one track at a fixed low bed — from the `HANDOFF.md`
audio table:

> `#underscore` | `musicfix.mp3` | 0.00–51.60 | **0.15** | Warm ambient pad under the whole video.

## 3.2 Music-as-the-engine brief (montage films)

When music drives pacing, the storyboard says so and picks a real track. website-to-hyperframes,
verbatim:

> **Music:** `lightstockmusic-strong-character-powerful-fuzz-action-sport-rock-513742.mp3`
> (plays from 0:00 untouched through 0:50)
> **Build philosophy:** **Every second earns a music event. Every beat self-ducks for voice.
> The visuals do the explaining — narration punctuates.**

Its audio timeline is drawn as an ASCII track sheet — copy this convention (verbatim):

```
TRACK  MUSIC        ╱╲╱╲╱╲╱╲╱╲╱╲══════════════════════════════════════════════ 50.0s
TRACK  VO (Rachel)  ·L1·L2·L3·L4─L5─── ····················· ─L6·L7······L14──L15──L16
TRACK  SFX          ·kb·kb·kb·kb·kb───·RZ·ek·bd· ·pn·pn··pn···whoosh···· ·fade
TRACK  MUSIC DUCK   ───-20dB────-15dB──0dB─────────────── -10dB───── -14dB──── fade
```

Legend (verbatim): `kb` = keyboard-typing · `RZ` = riser · `ek` = enter-key · `bd` = bass-drop
· `pn` = ping.

## 3.3 Ducking spec (real numbers)

Ducking is written in dB against named beats, not "lower it under the voice." From
website-to-hyperframes:

> Voice sits above music via ducking (**music -20dB during VO, full during gaps**).

And per-beat in the storyboard:

> **VO:** Rachel line 01 — *"Promo for your app?"* — **ducked music at -20 dB.**

The full-film ducking envelope (from the ASCII sheet above): `-20dB` under dense typing/VO,
`-15dB` easing out, `0dB` (full) on the music drop / visual-only moments, `-10dB` and `-14dB`
under the montage and CTA voice, then fade.

**Art-director rule:** every VO line in the storyboard gets a ducking note. Default ducking
depth **-15 to -20 dB under VO, 0 dB (full) during silent beats and music-only acts.** State
the depth in dB.

## 3.4 SFX as scored events (not ambience)

SFX are placed on the frame like a Foley pass, each tied to a visual action, often with the
exact source file. From sfx-music-launch `## Audio cue map` (verbatim rows):

> | film time | cue | source |
> | 0.0–10.4 | **SILENCE** (the joke; do not fill) | — |
> | Act 3 ~16.7–19.4 | mouse-click SFX on each cursor tap; keystroke ticks; card-exit whooshes | the SFX being sold |
> | Act 5 ~25.1–27.2 | **music bed in** (warm, bouncy ~110 BPM) + clicks continue | the soundtrack being sold |

The literal SFX library that ships (cloud-render-launch `assets/sfx/`): `chime`, `click`,
`pop`, `riser`, `success`, `swish`, `type`, `ux-chime`, `whoosh-morph`, `whoosh-slide`, plus a
`candidates/` bench (`sparkle-magic`, `scan-scifi-reveal`, `shimmer-soft-airy`,
`bell-ping`, `chime-metallic`, `riser-soft-dreamy`…).

Per-beat SFX direction reads like this (hyperframes Beat 5, verbatim):

> **SFX:** Silence under the first line. On the capture pulse — a soft, warm analog shutter
> click. Single.

And the flex sub-beats each get their own texture (hyperframes, verbatim):
> - 6A "CSS animations." → **Rhythmic tick. Metronome energy.**
> - 6B "GSAP." → **Percussive snap on the scale-up. Whooshes on orbits. Staccato taps as
>   secondary text lands.**
> - 6C "Lottie." → **Playful pluck. Soft marimba. Two notes — assembly, then takeoff.**
> - 6D "Shaders." → **Ambient wash. Airy, reverbed, almost vocal. A sustained tone.**
> - 6E "Three.js." → **Deep gentle hum. Almost subsonic. Grounding.**

## 3.5 Underscore / music direction template (fill-in-the-blanks)

```
## Underscore Direction
[GENRE + TEXTURE]. [ENTRY RULE — usually "already playing when the video starts,
no silence-to-sound transition"]. Sits under everything, never competes with VO.
Section map:
  - [00:00–00:XX] [state — e.g. "warm pad, low bed at 0.15"]
  - [00:XX–00:YY] [swell / drop — e.g. "swells gently during the flex section"]
  - [00:YY–end]  [resolve — e.g. "resolves on a final chord at close"]
Reference vibe: [ARTIST 1], the [softer/harder] end of [ARTIST 2].
Not [negative ref 1]. Not [negative ref 2].

## Ducking
Default: music -[15–20] dB under VO, 0 dB (full) during silent beats + music-only acts.
Per-line ducking noted inline in the storyboard.

## SFX cue map
| film time | cue (visual action it scores) | source file / texture |
```

**For our Lyria pipeline:** the section map + reference artists + BPM (when known, e.g.
"~110 BPM", "warm, bouncy") become the Lyria prompt. The negative references ("not trailer
music, not corporate stock") sharpen it. Emit BPM whenever the cut has a beat grid.

---

# 4. Per-beat storyboard field schema

Every beat in a HeyGen storyboard is a structured record. The art-director must emit these
fields per beat. Below is the schema with a **real per-field example** pulled from shipped
storyboards.

## 4.1 The fields

| Field | What it holds | Required? |
|---|---|---|
| **Beat ID + timecode + duration** | `BEAT 6D — "Shaders." (0:31–0:34) · 3.0s` | always |
| **VO** | the exact spoken line for this beat (or "No VO") | always |
| **Concept** | the idea in one or two sentences — what the viewer understands | always |
| **Camera** | motion of the virtual camera: drift, zoom, orbit, push, cut | when camera moves |
| **Palette / Mood** | mood direction + energy level (NOT fixed hex unless brand-faithful) | always |
| **Motion** | element choreography with eases + amplitudes + timings | always |
| **SFX** | the scored audio event(s) for this beat | always |
| **Text** | any on-screen copy, its font/size/treatment | when text on screen |
| **Transition out** | how this beat hands to the next (cut / morph / zoom-through) | always |

## 4.2 Real per-field examples (each quoted from source)

**Beat ID + timecode + duration** — hyperframes:
> `### BEAT 4 — THE ANATOMY (0:12–0:20)`

**VO** — hyperframes Beat 4:
> **VO:** "A div is a keyframe. Data attributes are your timeline. CSS is your look. GSAP is
> your animation engine."

**Concept** — hyperframes Beat 1:
> **Concept:** Camera is already moving when the video starts. No fade in. No preamble. We're
> mid-flight over a vast canvas — an infinite artboard — and scattered across it are dozens of
> living composition cards.

**Camera** — hyperframes Beat 1:
> **Camera:** Slow smooth diagonal drift (top-left to bottom-right), slight rotation (2-3° over
> 5s). Calm, authoritative. GSAP-driven path, gentle power1.inOut ease. Drone-shot-over-a-city
> energy.

**Palette / Mood** — hyperframes Beat 6D (mood direction, agent picks the hex):
> **Mood direction:** Full-bleed generative art. This is the moment the visual language breaks
> free of everything before it… Organic, warm-leaning, mesmerizing. Think: liquid materials,
> soap-bubble iridescence, molten surfaces.

…vs. **brand-faithful palette** (website-to-hyperframes, fixed hex, when a real brand is being
matched):
> ```
> Brand Cyan    #00C3FF  — HeyGen accent, primary brand moments
> Stripe Violet #533AFD  — Act 1 panel 1 accent
> Framer Pink   #F44BCC  — Act 1 panel 2 / holo moments
> Vibecode Green#3ECF8E  — Act 1 panel 3 accent
> ```

**Motion** — hyperframes Beat 4 (element choreography with named eases):
> **"A div is a keyframe"** — A rounded rectangle (the "div") fades in and slides into position
> on a horizontal timeline bar that draws itself beneath. Satisfying ease on the slide
> (power2.out).
> **"GSAP is your animation engine"** — An easing curve draws itself above the timeline — a
> smooth power2.out S-curve. The styled rectangle slides along the curve's path, demonstrating
> the ease in real time. Buttery motion.

…and a hard-numbers motion example (website-to-hyperframes Beat 1.7 "SHARP SPREAD"):
> Each panel flies with easing = `power4.out` over 140ms, scaling from 1.0 to 0.48 (to fit the
> quadrant as 960×540). Trail: 80ms motion blur via box-shadow.

**SFX** — hyperframes Beat 8:
> **SFX:** Soft clicks as nodes appear. Drawing sound on arrows. On "deterministic" — a crisp,
> satisfying lock/latch sound.

**Text** — website-to-hyperframes Beat 4.2 "HyperFrames Wordmark":
> the word **HyperFrames** appears in Inter Variable at 180px, weight 900, ink `#0B0B0F`.
> Fade in + subtle scale 0.96 → 1.0 over 0.4s. Subtle letter-spacing animation
> (-0.04em → -0.02em) giving it presence.

**Transition out** — cloud-render-launch S1a:
> **Transition out:** `morph` — message flies up to the bubble while the composer **docks** and
> the window **shrinks from full-bleed to floating** (one continuous move).

## 4.3 The copy-paste per-beat block

```
### BEAT [N] — [TITLE] ([start]–[end]) · [dur]s

**VO:** "[exact spoken line, or 'No VO — music carries']"

**Concept:** [1–2 sentences: what the viewer understands after this beat]

**Camera:** [drift / zoom / orbit / push / cut + ease + amplitude + duration; or "Locked"]

**Palette / Mood:** [mood + energy + reference — "Bauhaus color study, moving" —
OR fixed hex if brand-faithful]

**Motion:** [element choreography: what enters/moves/exits, with eases (power2.out),
amplitudes (y 24px→0), and timings (0.4s, 0.08s/letter stagger)]

**SFX:** [scored event(s) tied to the visual action + texture]

**Text:** [on-screen copy + font + size + weight + color + entrance] (omit if none)

**Transition out:** [cut / morph / zoom-through / cut-the-curve / mask-open]
```

## 4.4 The timing table (every storyboard ends with one)

Both flagship storyboards close with a single source-of-truth table. hyperframes (verbatim rows):

> | Beat | Start | End | Dur | VO cue | Visual |
> |------|-------|-----|-----|--------|--------|
> | 1 | 0:00 | 0:05 | 5.0s | "Your AI agent already knows..." | Infinite canvas fly-through |
> | 6A | 0:24 | 0:26.5 | 2.5s | "CSS animations." | Geometric CSS choreography |
> | 6C | 0:29 | 0:31 | 2.0s | "Lottie." | Vector character assembly |
> | 10 | 0:54 | 1:00 | 6.0s | "Hyperframe. Go make something." | Pull back to canvas + wordmark |

**Rule:** the last thing the art-director emits is a timing table where the beat rows sum to
the target runtime. This table is what the sequencer reads to place each sub-composition's
`data-start`.

---

# 5. Global design guardrails

These are HeyGen's cross-video art-direction laws. Quote them into the art-director's context;
they are the difference between "AI slop" and their register.

## 5.1 The four guardrails (verbatim from hyperframes `STORYBOARD.md`)

> **Global guardrails:**
> - **No dark-mode-default.** The home-base feel across the video is light, warm, and open.
>   Dark moments are brief departures, not the norm.
> - **Push color presence.** Muted is fine, flat is not. Every beat should have at least one
>   color that pulls your eye.
> - **Typography should be distinctive per beat.** No single font family across the whole video.
>   Each aesthetic world gets its own typographic voice.
> - **Motion should be visible and intentional.** Err toward more movement than feels safe —
>   subtle reads as static at 30fps.

## 5.2 "Don't prescribe a palette" — mood, not hex

hyperframes `## Color & Style Direction`, verbatim — this is how the art-director hands
execution to the composition:

> **Do not prescribe a palette.** Each composition should use the Editor Agent's own style
> system and skill guidance to select colors, fonts, and textures appropriate to the mood
> direction described per beat. The storyboard specifies **aesthetic mood, energy level, and
> reference direction — the agent handles execution.**

**Exception — brand-faithful mode.** When the film matches a real brand (Stripe, HeyGen,
Grok), the palette IS fixed hex, extracted from the crawl. cloud-render-launch's `frame.md`
front-matter is the model: a full token block with roles, plus the rationing discipline
(verbatim):

> **Mint is rationed** like a passing build — progress, done, play, logo. One mint gesture per
> frame. Never tint body text or large fills mint except the single "New video" pill.

The Grok `design.md` shows the same rigor for a dark brand, including the anti-slop bans
(verbatim `## Avoid`):

> - Warm paper/cream backgrounds from the Claude source.
> - Claude clay as the primary accent.
> - Orange SuperGrok offer badges or sale UI.
> - **Generic blue-on-dark AI palettes.**
> - Center-only empty frames without connector details or Grok identity.

## 5.3 The "Frame Craft Bar" and squint test

cloud-render `frame.md` codifies a legibility floor with a **squint test** — the art-director
should emit one per film (verbatim):

> **Squint test:** S1–S8 read as a warm paper field with one dark window or one big line; S9
> reads as a dark grid of glowing video tiles with one mint logo in a cleared center.

Plus depth/legibility rules (verbatim):

> - **Depth via lightness + hairlines**, not heavy shadows. The site ships only a whisper
>   shadow (`0 1px 2px #00000005`). Cards separate by 1px hairline / dashed border.
> - **Soft corners (8/14px), not sharp.** hyperframes.dev rounds everything; honor it.

## 5.4 Motion amplitude — bans and ceilings

Real motion guardrails from cloud-render `frame.md` `## Motion Register` (verbatim `Bans`):

> **Bans:** idle hover-wobble / sine-drift filler · **overshoot beyond ~1.04** · neon glow on
> the mint (it's a flat brand green→cyan, not a bloom) · crossfading the whole film (cut + the
> one big zoom-through carry the seams) · pixel/CRT retro-isms · **a static endcard (the logo
> lands in moving footage, never on a dead frame).**

And the positive law that recurs — "the frame keeps performing" (verbatim):

> **The frame keeps performing** — tiles keep playing, bars keep filling, the perimeter of the
> S9 grid never freezes even as the logo lands. A scene is never "done."

Also the "different universes" rule for capability montages (hyperframes Beat 6, verbatim):

> The agent should use a DIFFERENT palette, typography, and visual language for each. **No two
> should share a font or dominant color.** Push variety as far as taste allows. These are not
> variations on a theme — **they are different universes.**

## 5.5 Typography-per-beat (concrete)

Distinctive type per world, real specs, loaded locally. website-to-hyperframes fonts table
(verbatim) — note "all local @font-face, no CDN at render":

> | Role | File | Weights |
> | Display | `BungeeShade-Regular.woff2` | 400 only |
> | Sans | `Inter-Variable.woff2` | 100-900 variable |
> | Mono | `JetBrainsMono-Variable.woff2` | 100-800 variable |

cloud-render three-voice system (verbatim):

> Type is three voices: **ABC Solar Display** for the wordmark and the big text beats, **TT
> Norms Pro** for everything legible, and **TT Norms Pro Mono** for the commands and job
> metadata — the mono is what makes `hyperframes cloud render` read as a real tool.

Grok `design.md` maps type to role (verbatim):
> - `display`/`body`: "Hanken Grotesk" · `serif`: "Newsreader" for long answer prose and
>   generated-video editorial beats · `mono`: "Spline Sans Mono" for tool pills, metadata, and
>   code-like UI.

**Guardrail:** always specify at least a **display / sans / mono** trio, load fonts locally
(`@font-face`, no CDN at render), and give montage beats their own display face.

## 5.6 The guardrail checklist (art-director must self-audit before emitting)

```
[ ] Light-first? (dark scenes are departures, not default — unless brand is dark-native)
[ ] Every beat has ≥1 eye-pulling color? (muted ok, flat not ok)
[ ] Distinct typographic voice per aesthetic world? (no single font across the film)
[ ] Motion visible at 30fps? (subtle = static; err toward more movement)
[ ] Overshoot ≤ ~1.04? No idle sine-drift filler?
[ ] Endcard lands in MOVING footage, never a dead frame?
[ ] Depth from lightness + 1px hairlines, not heavy shadows?
[ ] Brand accent rationed (≤1 gesture per frame) if brand-faithful?
[ ] Passes the squint test I wrote for this film?
```

---

# 6. The SCRIPT.md / STORYBOARD.md / HANDOFF.md doc-trio

Every HeyGen launch emits this trio. Our pipeline should emit the same three files per video.
Below is the canonical skeleton for each, matching what shipped.

## 6.1 `SCRIPT.md` template

```markdown
# [Product] Launch Video — Script v[N]

**Status:** [Draft / Approved copy / Awaiting VO generation]
**Duration target:** ~[N]s
**Voice:** [Gemini voice name/id]  ·  **Settings:** [rate / style / stability equivalents]

**Voice direction (global):** [CASTING] + [NAMED REFERENCE + subtractive qualifier] +
[CADENCE PHILOSOPHY] + [RESTRAINT RULE]. (See §2.)

---

## Spoken VO
> Spoken lines only. No inline directions, no emphasis markdown, no author notes.
> This block feeds Gemini TTS verbatim.

```
[clean spoken text, paragraph-broken for pacing, respellings like "G-Sap" inline]
```

---

## Silent visual beats (not spoken)
1. **After "[anchor line]"** — ~[N]s. [what the picture does]. [in-file gap | sequencer gap]

---

## Per-line delivery direction
- Line N — "[quote]" ([start]–[end]s) — [register + micro-direction]

---

## Pronunciation cues (for TTS)
- **[Name/acronym]** — pronounced *[respelling]*. [note]

---

## Word count
Spoken: ~[N] words ≈ [N]s at keynote cadence. With [silent beats] → total ~[N]s.
```

## 6.2 `STORYBOARD.md` template

```markdown
# [Product] Launch Video — Storyboard v[N]

**Format:** 1920×1080 · [N]s max · 30fps · MP4
**Audio:** [Gemini VO] + SFX design + [Lyria underscore]
**VO direction:** [one-line character brief — quote-ready]
**Built with:** [our renderer] (the video is its own proof)

---

## Color & Style Direction
[Either "Do not prescribe a palette — mood per beat, agent executes" (mood mode)
 OR a fixed hex token block extracted from the crawl (brand-faithful mode).]

**Global guardrails:** [the four from §5.1]

---

## Underscore Direction
[genre + entry rule + section map w/ timecodes + reference artists + negative refs] (§3.5)

## Ducking + SFX cue map
[dB envelope + ASCII track sheet + per-beat SFX] (§3.3–3.4)

---

## Script (~[N] words, ~[N]s)
```
[storyboard copy WITH [pause] markers — the director's version, not the TTS version]
```

---

## Beat-by-Beat
### BEAT [N] — [TITLE] ([start]–[end]) · [dur]s
[the §4.3 field block per beat]

---

## Production Architecture
[root index.html + sub-composition file list, one per beat]

---

## Timing Table
| Beat | Start | End | Dur | VO cue | Visual |
[rows sum to target runtime]
```

Real "Production Architecture" example (hyperframes, verbatim) — one sub-composition per beat:

```
index.html                          root — VO + underscore + orchestration
├── compositions/canvas-open.html   infinite canvas fly-through (0:00–0:05)
├── compositions/proposition.html   HTML-in-video-out diagram (0:09–0:12)
├── compositions/anatomy.html       div/timeline/css/gsap build (0:12–0:20)
├── compositions/flex-shader.html   WebGL shader (0:31–0:34)
└── compositions/canvas-close.html  return to canvas + wordmark (0:54–1:00)
```

## 6.3 `HANDOFF.md` template

The handoff is the **living build log + source-of-truth schedule + gotchas**, written for the
next agent/session. hyperframes and timeline HANDOFFs are the model. Skeleton:

```markdown
# Handoff — [Product]

**Latest:** [date] (Session [N])
**Session:** [one-line what-changed]
**Preview:** [preview command]
**Render:** [render command]

---

## Session [N] — [title]
[what broke, root cause, the fix pattern, a code snippet if load-bearing]

---

## What's left
[scoped remaining work; what's locked vs open]

---

## Current Beat Schedule
Source of truth is `index.html`. VO is `[file]` ([N]s). Master duration [N]s.
| Beat | Composition | Start → End | Master dur | VO |
[the real per-beat schedule the renderer uses]

---

## Audio tracks (current)
| Element | Asset | Range | Vol | Notes |
[#voiceover / #underscore / #sfx-* rows with volumes]

---

## Architecture notes / gotchas that shouldn't be touched
[the load-bearing fixes: timeline padding, body bg, video-at-root, etc.]

---

## Commands
[preview / lint / validate / render / re-transcribe]

---

## File tree
[load-bearing files only; everything else in archive/]
```

Real "Audio tracks" table (hyperframes `HANDOFF.md`, verbatim rows):

> | Element | Asset | Range | Vol | Notes |
> | `#voiceover` | `voiceover_v3_gap.mp3` | 0.00–49.76 | 1.0 | v3 VO with 1s silent gap at ~3s |
> | `#underscore` | `musicfix.mp3` | 0.00–51.60 | 0.15 | Warm ambient pad under the whole video |
> | `#sfx-click` | `twinkle-glock.mp3` | 29.87–31.40 | 0.2 | Tonal sparkle at "sound effects" beat |
> | `#compose-aroll` | `pill.mp4` | 32.05–34.27 | — | Muted, composed A-roll for flex-compose |

## 6.4 Real handoff gotchas worth encoding as pipeline rules

These recurred across projects and our renderer should either avoid or document them:

- **Pad short timelines to the master slot** or you get black-frame flashes. hyperframes fix
  pattern (verbatim):
  > ```js
  > // Pad timeline to master slot duration (XYZs) to prevent black frames at beat tail
  > tl.to({}, { duration: XYZ }, 0);
  > ```
  Root cause logged: "HF decides composition visibility from each sub-composition's **GSAP
  timeline duration** (`timeline.duration()`), not from the `data-duration` attribute."
- **Body bg must be warm/near-white, not black** — kills black flashes at cut-the-curve seams.
  timeline handoff (verbatim): "`#f5f5f7` body bg … This is what kills the black-flash at
  cut-the-curve boundaries — if you see `background: #000` come back, something reverted."
- **`<video>` must be a body-level sibling of the stage / a direct child of root** or HF won't
  drive `currentTime`. Two projects independently hit this — timeline handoff: "HF won't drive
  `<video>.currentTime` unless the element is a direct child of the root composition."
- **No `repeat: -1`** — HF lint bans infinite loops; use `Math.floor(total / cycleDur) - 1`.
- **Audio needs one user gesture to unlock in preview** (browser autoplay policy) — "click the
  studio Play button once; audio unlocks and stays unlocked for the session." Not a bug in the
  composition.
- **Don't auto-render** — render only on explicit "render it / ship it."

---

# 7. Copy-paste prompt fragments for our system prompts

Paste these verbatim into the storyteller and art-director system prompts. They encode
everything above in imperative form.

## 7.1 Storyteller system-prompt fragment

```
You are the STORYTELLER for Launch Studio. You receive a crawled product URL + a brief and
you output SCRIPT.md. You write launch-video voiceover in the register of a HeyGen product
launch: economy of words, keynote cadence, silence as a feature.

DURATION MATH (obey this):
- Budget ~2.2 spoken words per second at keynote cadence.
- A 30s film = ~55–70 spoken words MAX. A 60s film ≈ 110 words. If you wrote 140 for 60s,
  CUT — density is the enemy; freed seconds are a feature.
- Voice occupies only 40–50% of runtime. The rest is silent beats + music-only stretches.
- Every film has ≥1 planned silent beat per ~20s of runtime.

OUTPUT THREE SEPARATE BLOCKS — never merge them:
1. "## Spoken VO" — clean text ONLY. No stage directions, no emphasis asterisks, no author
   notes like "(update)", no [pause]. This is pasted verbatim into Gemini TTS. Put respellings
   INTO this block (write "G-Sap", not "GSAP") when TTS would mispronounce.
2. "## Silent visual beats (not spoken)" — numbered: (anchor line) + (what the picture does) +
   (in-file gap vs sequencer gap). Budget them into the duration math.
3. "## Pronunciation cues" — one line per acronym / camelCase name / file-ext / number-in-copy.

VOICE DIRECTION = A CHARACTER, NOT A SETTING. Write a global brief with four parts:
  [casting] + [named real reference + subtractive qualifier] + [cadence philosophy] +
  [restraint rule].
Model to imitate: "Mid-age male, calm confident delivery. Apple keynote presenter register —
Craig Federighi energy without the jokes. Economy of words. Silence between sentences is a
feature. Every word earns its place."
Then add per-line delivery ("upward lilt — genuine curiosity"; "drop into confidence, ends
with a smile the listener can hear"; "warm, not sales-y"). Always: "feels like a person,
never like a reader."

For montages, write ONE short label per clip, each with its own timecode, each destined for
its own TTS file (NN-slug.mp3). Trailer-cadence, period-stopped.

COPY HYGIENE: lowercase "agent"; hyphenate compound adjectives ("pixel-perfect"); prefer "to"
over "into" for single-format output; strip all markdown emphasis from the spoken block.

Name the story archetype at the top (default: Hook → Turn → Proof → CTA; or Before-After-Bridge).
End with "## Word count" showing words → spoken seconds → total-with-silence math.
```

## 7.2 Art-director system-prompt fragment

```
You are the ART DIRECTOR for Launch Studio. You receive SCRIPT.md and output STORYBOARD.md
(and frame.md when the film is brand-faithful). You direct in the register of a HeyGen launch.

GLOBAL GUARDRAILS (enforce every beat):
- Light-first. Home-base feel is light, warm, open. Dark scenes are brief departures — unless
  the crawled brand is dark-native (then honor it, and ban "generic blue-on-dark AI palettes").
- Push color presence. Muted is fine, flat is not. Every beat has ≥1 color that pulls the eye.
- Distinctive typography PER BEAT. No single font family across the film. Specify a display /
  sans / mono trio; give montage beats their own display face; load fonts locally, no CDN.
- Motion visible + intentional. Err toward more movement than feels safe — subtle reads as
  static at 30fps. But: overshoot ≤ ~1.04, no idle hover-wobble / sine-drift filler.
- The frame keeps performing — no static endcard; the logo lands in MOVING footage.
- Depth from lightness + 1px hairlines, not heavy shadows. Soft corners (8–14px).

PALETTE MODE:
- Default = MOOD MODE: "Do not prescribe a palette. Specify aesthetic mood, energy level, and
  reference direction per beat — the composition agent executes color/font/texture." Write
  moods like "Bauhaus color study, moving" / "soap-bubble iridescence, molten surfaces".
- BRAND-FAITHFUL MODE (a real brand is being matched): emit frame.md with fixed hex tokens
  extracted from the crawl, role-named, plus rationing rules ("one accent gesture per frame")
  and an "Avoid" list of brand-breakers. Hold interface-color and product-color apart (the
  cloud-render thesis: clay = the assistant, mint = the product — never muddled).

PER-BEAT SCHEMA (emit every field):
  BEAT ID + timecode + duration · VO · Concept · Camera · Palette/Mood · Motion · SFX · Text ·
  Transition out.
  Motion carries eases (power2.out), amplitudes (y 24px→0), timings (0.4s, 0.08s/letter).
  Transitions from the HeyGen grammar: cut · morph · zoom-through · cut-the-curve · mask-open.

CAPABILITY MONTAGES: each sub-beat is a DIFFERENT UNIVERSE — no two share a font or dominant
color. Hard smash cuts; the abrupt switch IS the proof.

AUDIO:
- Underscore brief = genre + texture + entry rule ("already playing when the video starts, no
  silence-to-sound transition") + section map with timecodes (swell/drop/resolve) + named
  reference artists + negative refs ("not trailer music, not corporate stock"). Emit BPM when
  the cut has a beat grid (for Lyria).
- Ducking in dB: -15 to -20 dB under VO, 0 dB (full) during silent beats + music-only acts;
  note ducking per VO line.
- SFX are scored events tied to visual actions, each with a texture ("crisp lock/latch on
  'deterministic'"; "metronome tick"; "airy reverbed wash"). Draw an ASCII audio track sheet.

CLOSE with a "## Timing Table" (Beat | Start | End | Dur | VO cue | Visual) whose rows sum to
the target runtime — this is the sequencer's source of truth for each sub-composition data-start.

SELF-AUDIT before emitting: light-first? color per beat? font per world? motion visible?
overshoot ≤1.04? endcard moving? depth via hairlines? accent rationed? passes the squint test
you wrote for this film?
```

## 7.3 Shared "doc-trio contract" fragment (both agents)

```
Every video emits three files, in this order:
1. SCRIPT.md   (storyteller) — spoken VO (clean) + silent beats + pronunciation cues + voice
   character brief + word-count math.
2. STORYBOARD.md (art-director) — color/style direction + global guardrails + underscore &
   ducking & SFX + per-beat schema + production architecture (one sub-composition per beat) +
   timing table.
3. HANDOFF.md (renderer/build) — living build log + current beat schedule (source of truth) +
   audio-track table with volumes + load-bearing gotchas + preview/render commands + file tree.

Render-safety rules to encode in HANDOFF and honor in output:
- Pad every sub-composition timeline to its master slot: tl.to({}, { duration: SLOT }, 0);
  else black-frame flashes at beat tails.
- Body background near-white/warm, never #000 — kills black flashes at seams.
- <video> is a body-level sibling of the stage / direct child of root, or currentTime won't
  drive.
- No repeat:-1 (lint bans infinite loops); use Math.floor(total/cycleDur) - 1.
- Never auto-render; render only on explicit "render it / ship it".
```

## 7.4 The one-paragraph "register" primer (prepend to both agents)

```
HOUSE STYLE (HeyGen launch register): The video is its own proof. Every second earns a music
event; every beat self-ducks for voice; the visuals do the explaining and narration only
punctuates. The voice is a calm confident person, not a reader — Craig-Federighi-keynote
energy, economy of words, and silence between sentences treated as a feature. The picture is
light-first and warm, motion is visible and intentional, and each aesthetic world gets its own
type and color. Cut words to buy time and impact. A scene is never "done" — the frame keeps
performing to the last held second.
```

---

## Appendix A — Named references library (extend as you go)

**Voice:** Craig Federighi (product-confident, dry) · trailer-VO (montage escalation) · curious
question-hook (upward lilt) · warm sign-off (a smile you can hear, never sales-y).

**Music:** Tycho (warm ambient pad) · the softer end of Jon Hopkins (minimal electronic) ·
"strong-character powerful fuzz action-sport rock" (montage-drive) · "warm, upbeat, ~110 BPM,
nice bounce" (payoff). Negative refs to keep on hand: "not trailer music, not corporate stock."

**Transitions grammar (HeyGen):** `cut` · `morph` (element flies + window docks/shrinks, one
continuous move) · `zoom-through` (camera pushes INTO a window, it grows past frame, dissolves
to the world behind — "the window is the portal") · `cut-the-curve` (directional momentum cut,
matched ~10px blur + opposite offsets on both sides of the seam — "Don't adjust one side
without adjusting the other") · `mask-open` / `center mask-open` (dark window scales up from a
point, `scale 0.04 → 1`, expo.out, ~0.6s).

**SFX palette (shipped files):** chime · click · pop · riser · success · swish · type ·
ux-chime · whoosh-morph · whoosh-slide · sparkle-magic · scan-scifi-reveal · shimmer-soft-airy ·
bell-ping · chime-metallic · riser-soft-dreamy.

## Appendix B — Duration cheat-sheet

| Runtime | Spoken-word budget | Silent beats | Voice-time target |
|---|---|---|---|
| 15s | ~28–34 words | 1 | ~7–8s |
| 30s | ~55–70 words | 1–2 | ~12–15s |
| 45s | ~85–100 words | 2 | ~18–21s |
| 60s | ~110 words | 2 | ~21–27s |

Cadence anchor: **~2.2 words/sec spoken; voice = 40–50% of runtime; the rest is music + picture.**

## Appendix C — Source files this method was harvested from

- `hyperframes-launch/SCRIPT.md`, `STORYBOARD.md`, `HANDOFF.md` — the flagship 60s film; script
  v2→v3 rewrite rationale, silent-beat spec, flex "different universes" rule, timeline-pad fix.
- `website-to-hyperframes/SCRIPT.md`, `STORYBOARD.md` — per-line delivery, ducking in dB, ASCII
  track sheet, brand-faithful palette, montage line-per-clip, NN-slug.mp3 file naming.
- `timeline-launch/STORYBOARD.md`, `HANDOFF.md` — problem→solution comedic arc, body-bg
  black-flash fix, video-at-root rule, cut-the-curve matched-blur seams.
- `cloud-render-launch/STORYBOARD.md`, `design-system/frame.md` — Before-After-Bridge archetype,
  two-brands-on-screen discipline, Frame Craft Bar, squint test, motion bans.
- `spacex-launch/design.md` (Grok) — dark-native brand tokens, role-mapped type, "Avoid" list.
- `sfx-music-launch/STORYBOARD.md` — SFX-as-scored-events cue map, seam grammar (mask-open /
  zoom-through / cut-the-curve), "build silent, sound in post."
- `inspector-launch/STORYBOARD.md`, `variables-launch/HANDOFF-HOOK-VARIANTS.md` — one-focus-per-
  beat discipline, contact-sheet-before-polish, text-behind-subject hook layering.
