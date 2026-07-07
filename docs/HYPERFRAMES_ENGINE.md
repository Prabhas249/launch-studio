# HyperFrames Engine Guide

Practical reference for emitting valid HyperFrames HTML compositions from the launch-studio director agent. Covers every contract the renderer enforces, the full CLI, and a complete worked COLD_OPEN example.

---

## 1. Where Our Pipeline Plugs In

HyperFrames (Apache 2.0) renders HTML files to MP4 by seeking headless Chrome frame-by-frame. It has no notion of "what the video should say" — that is entirely our product:

```
URL → crawler → storyteller LLM (script + scene JSON)
                     ↓
             art-director LLM
                     ↓
         per-scene HTML sub-comps  ←— HyperFrames contract lives here
                     ↓
         assembler (assemble-index.mjs)
                     ↓
         index.html (orchestrator) + TTS audio + BGM audio
                     ↓
         npx hyperframes render  →  MP4
```

Our moat: the storyteller + art-director brain. HyperFrames provides deterministic headless rendering. The engine is swappable; our pipeline is not.

---

## 2. Composition Contract

### 2.1 Root Element Attributes

Every composition is one HTML file. The root element is a `<div>` (inside a `<template>` for sub-comps — see section 4). It carries four required attributes:

| Attribute | Required | Value | Notes |
|-----------|----------|-------|-------|
| `data-composition-id` | yes | string | Must match the key in `window.__timelines[...]` exactly |
| `data-width` | yes | integer px | Common: `1920` (landscape), `1080` (portrait/square) |
| `data-height` | yes | integer px | Common: `1080` (landscape), `1920` (portrait) |
| `data-duration` | yes | number (seconds) | Read ONCE at compile time before scripts run — cannot be changed by a script |

Root CSS requirements:

```css
#root {
  position: relative;   /* or absolute with inset:0 */
  width: 1920px;
  height: 1080px;
  overflow: hidden;
}
```

If either dimension is missing or the element collapses, the renderer produces a blank video with no error.

### 2.2 Clip Elements

A clip is any timed, visible child of the composition root.

Rules:
- Must be a **DIRECT child** of the composition root `<div>` — no wrapper divs between clip and root.
- Must carry `class="clip"` (exception: `<video>` and `<audio>` elements — the runtime manages those directly).
- Must have all four timing attributes:

| Attribute | Value | Notes |
|-----------|-------|-------|
| `id` | unique string | Stable; used by GSAP selectors |
| `data-start` | number (s) or `"<clip-id> + N"` | Relative timing: `"hero + 0.5"` starts 0.5s after clip `hero` starts |
| `data-duration` | number (s) | Can be driven by scripts/variables (unlike root `data-duration`) |
| `data-track-index` | integer | Lane number. Two clips on the same track must NOT overlap in time |

Visibility window is inclusive: the clip is visible when `data-start <= t <= data-start + data-duration`.

```html
<div class="clip" id="headline"
     data-start="0.5" data-duration="4" data-track-index="1">
  Ship your launch video in an afternoon.
</div>
```

### 2.3 Track Index Convention

The assembler uses this convention (enforce it in all output):

| Track | Content |
|-------|---------|
| 0 | A-roll video |
| 1 | Visual / scene sub-comp frames |
| 2 | Captions overlay |
| 10 | Per-scene TTS voice audio |
| 11 | BGM audio |
| 20+ | SFX audio |

### 2.4 Legacy Aliases (Do Not Emit)

Older compositions use these — avoid generating them:
- `data-layer` → replaced by `data-track-index`
- `data-end` → replaced by `data-duration`

---

## 3. The Paused-GSAP-Timeline Registration Pattern

The renderer seeks compositions by calling `tl.totalTime(t, false)` for every frame. The GSAP timeline must be:

1. Created synchronously at page load (not in a callback, not in async code).
2. Initialized as `{ paused: true }`.
3. Registered on the global `window.__timelines` object under the key that exactly matches `data-composition-id`.

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<script>
  (function () {
    window.__timelines = window.__timelines || {};
    const tl = gsap.timeline({ paused: true });

    // — all tweens go here —

    window.__timelines["my-scene-id"] = tl;  // key = data-composition-id
  })();
</script>
```

Use bracket notation when the ID contains a hyphen — JavaScript property access with dots would fail:

```js
window.__timelines["cold-open"] = tl;  // correct
window.__timelines.cold-open = tl;      // SyntaxError
```

The engine performs two seeks per frame to force dirty state:

```js
tl.totalTime(t + 0.001, true);
tl.totalTime(t, false);
```

This means all animation state must be a pure function of time. Any property that remembers "which direction it was going" will desync.

### 3.1 Other Animation Runtimes (Secondary)

| Runtime | Global to register | Seek mechanism |
|---------|-------------------|----------------|
| Lottie / dotLottie | `window.__hfLottie.push(anim)` | `goToAndStop(timeMs, false)` |
| Anime.js | `window.__hfAnime.push(anim)` | `instance.seek(timeMs)` |
| Three.js | none (uses events) | `window.addEventListener("hf-seek", e => ...)` |
| CSS keyframes | none (auto-discovered) | WAAPI `Animation.currentTime` |

For our pipeline, GSAP is the only runtime needed. Do not mix runtimes in a single scene unless there is an explicit reason.

---

## 4. Sub-Compositions

### 4.1 Two Structural Shapes

**Standalone** (the `index.html` root): the composition `<div>` sits directly in `<body>` with no `<template>` wrapper. Used for the top-level orchestrator.

**Sub-composition** (any file loaded via `data-composition-src`): the composition `<div>` is wrapped in a `<template>`. Everything — `<style>`, `<script>`, markup — goes inside `<template>`. The `<head>` is discarded at load time.

```html
<!-- compositions/scenes/01-cold-open.html -->
<template id="cold-open-template">
  <style>
    #root { position: absolute; inset: 0; background: #08090a; }
    /* Style by #root selector, NOT by class on the root element */
    #root .headline { font-size: 120px; color: #f4f4f0; }
  </style>

  <div id="root"
       data-composition-id="cold-open"
       data-width="1920"
       data-height="1080"
       data-duration="6">
    <!-- DOM content -->
  </div>

  <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
  <script>
    (function () {
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });
      window.__timelines["cold-open"] = tl;
    })();
  </script>
</template>
```

### 4.2 Sub-Comp Slot in the Orchestrator (index.html)

```html
<!-- index.html root div — note: no <template> wrapper on the root -->
<div data-composition-id="main" data-width="1920" data-height="1080" data-duration="90">

  <!-- Scene 01: cold open, 6 seconds starting at t=0 -->
  <div class="clip" id="scene-01"
       data-composition-id="cold-open"
       data-composition-src="compositions/scenes/01-cold-open.html"
       data-width="1920" data-height="1080"
       data-start="0" data-duration="6" data-track-index="1">
  </div>

  <!-- Scene 02: problem statement, 8 seconds -->
  <div class="clip" id="scene-02"
       data-composition-id="problem"
       data-composition-src="compositions/scenes/02-problem.html"
       data-width="1920" data-height="1080"
       data-start="6" data-duration="8" data-track-index="1">
  </div>

  <!-- TTS voice audio for scene 01 -->
  <audio id="voice-01" src="assets/audio/voice-01.mp3"
         data-start="0" data-duration="6" data-track-index="10"
         data-volume="1.0">
  </audio>

  <!-- BGM -->
  <audio id="bgm" src="assets/audio/bgm.mp3"
         data-start="0" data-duration="90" data-track-index="11"
         data-volume="0.35">
  </audio>

</div>
```

### 4.3 Three Silent Pitfalls That Pass lint/validate/inspect

All three pass every pre-render check but break at render:

1. **`<style>` left in `<head>`** — the `<head>` is discarded when sub-comp is loaded. Text renders tiny/unstyled. Fix: move all `<style>` inside `<template>`.

2. **Host `data-composition-id` does not match template root `data-composition-id`** — the renderer waits ~45 s per scene then captures the initial static frame. Fix: the `id` in the slot div and the `data-composition-id` in the sub-comp root must be identical strings.

3. **Root styled by a class instead of `#root`** — class-keyed CSS rules are dropped when the sub-comp is composited. Looks fine in Studio preview; silently broken at render. Fix: always style the root element via `#root { ... }`.

Run `npx hyperframes snapshot --at 2,6,12` after any sub-comp change. It is the only gate that catches cross-file mount failures. lint/validate/inspect evaluate each file in isolation and cannot detect these.

---

## 5. Variables

Declare variables on the `<html>` element:

```html
<html data-composition-variables='[
  {"id": "headline",  "type": "string",  "label": "Headline",  "default": "Ship faster."},
  {"id": "accent",    "type": "color",   "label": "Accent",    "default": "#2a48f0"},
  {"id": "duration",  "type": "number",  "label": "Duration",  "default": 6},
  {"id": "show_cta",  "type": "boolean", "label": "Show CTA",  "default": true},
  {"id": "style",     "type": "enum",    "label": "Style",     "default": "dark",
   "options": ["dark", "light", "warm"]}
]'>
```

Read them inside `<script>`:

```js
const vars = window.__hyperframes.getVariables();
const headline = vars.headline;  // string
const accent   = vars.accent;    // #rrggbb
```

Override per-instance from the host slot:

```html
<div class="clip" id="scene-01"
     data-composition-src="..."
     data-variable-values='{"headline": "Your launch video in minutes.", "accent": "#c84f1c"}'>
</div>
```

Override at CLI render time:

```bash
npx hyperframes render --variables '{"headline": "Q4 Launch", "accent": "#2a48f0"}'
```

Variable types: `string`, `number`, `color`, `boolean`, `enum`. `data-duration` on clip elements (not the root) CAN be set from a variable at runtime.

---

## 6. Determinism Rules

The renderer seeks compositions out of order, in parallel, and from arbitrary time offsets. State that depends on reaching a frame through a prior frame will desync.

### Hard Bans — Emit None of These

| Banned pattern | Why | Fix |
|----------------|-----|-----|
| `Date.now()`, `performance.now()` | Clock advances between seeks | Encode time as GSAP timeline position |
| Unseeded `Math.random()` | Different value each seek | Use a seeded PRNG or deterministic layout math |
| `repeat: -1` (infinite GSAP repeat) | Never resolves, blocks seek | Compute finite count: `Math.max(0, Math.floor(duration / cycle) - 1)` |
| Timeline built in `async`, `Promise`, `setTimeout`, or event handler | Not ready when engine first seeks | Build timeline synchronously at page load |
| Render-time network fetch for required assets | Fetch may not complete before seek | Pre-bundle or inline assets |
| `hover`, `scroll`, `pointer`, `focus` state | Renderer has no input events | Use timeline-driven state changes only |
| `gsap.set()` on elements from other scenes not yet in DOM | Selector fails silently | Use `tl.set(selector, vars, time)` inside the timeline |
| Animating `display` or `visibility` | Breaks clip lifecycle | Use `autoAlpha` for show/hide at endpoints, or clip timing |
| Animating `width`, `height`, `top`, `left`, `right`, `bottom` | Layout reflows break seek consistency | Use `scaleX/Y` or `x/y` transforms |
| CSS `transform` on an element also animated with GSAP `x/y/scale` | GSAP overwrites the whole transform, silently drops CSS centering | Use GSAP for all transforms on the same element, or use a wrapper |
| `<br>` in body text | Forces extra break when line already wraps at 1920px | Use a wrapper div per line |

### Animatable Property Allowlist

Only animate properties from this list. Everything else risks layout reflows or invisible desyncs:

```
opacity, x, y, scale, scaleX, scaleY,
rotation, rotationX, rotationY,
skewX, skewY, transformOrigin,
color, backgroundColor, borderColor, borderRadius,
CSS variables (e.g. "--hue": 180),
volume (on <audio>/<video>),
innerText (numeric counters with snap: { innerText: 1 }),
backgroundPosition (for shimmer sweeps),
filter (blur — use sparingly, GPU cost)
```

### Prefer `fromTo` Over `from` Inside Sub-Comps

`from()` records the starting state at timeline registration time. If the engine seeks backward, the recorded state may be stale. `fromTo()` always knows both endpoints regardless of seek direction:

```js
// Correct — seek-safe
tl.fromTo("#headline",
  { y: 48, opacity: 0 },
  { y: 0,  opacity: 1, duration: 0.6, ease: "power3.out" },
  0.2);

// Risky in sub-comps — can desync on seek-back
tl.from("#headline", { y: 48, opacity: 0, duration: 0.6 }, 0.2);
```

---

## 7. Media in Compositions

**The non-negotiable rule:** `<video>` and `<audio>` elements must be direct children of the HOST composition root (`index.html`'s root div). Never inside a sub-comp `<template>`. Never wrapped in any intermediate `<div>`.

The runtime only registers and drives media that is a direct root child. Media inside a wrapper or sub-comp renders as blank/black/grey. lint/validate/inspect do NOT catch this. Per-frame `snapshot` shows the blank panel.

```html
<!-- CORRECT: direct children of the host root div -->
<div data-composition-id="main" ...>
  <video id="a-roll" src="assets/demo.mp4"
         data-start="0" data-duration="12" data-track-index="0"
         muted playsinline></video>

  <audio id="voice-01" src="assets/audio/voice-01.mp3"
         data-start="0" data-duration="6" data-track-index="10"
         data-volume="1.0"></audio>

  <audio id="bgm" src="assets/audio/bgm.mp3"
         data-start="0" data-duration="90" data-track-index="11"
         data-volume="0.35"></audio>

  <div class="clip" id="scene-01" data-composition-src="..." ...></div>
</div>
```

**Audio fades/ducking** are authored on the main timeline at global time coordinates:

```js
// In index.html's main timeline — duck BGM under voiceover
tl.to("#bgm",   { volume: 0.1, duration: 0.5 }, 0);       // fade down at VO start
tl.to("#bgm",   { volume: 0.35, duration: 0.8 }, 5.5);    // fade back up after VO ends
```

**A sub-comp timeline cannot reach host elements.** Cross-boundary `document.querySelector` does not resolve. All motion on host media (scale, opacity, blur) must be authored on the main timeline in `index.html` at global time = scene-local offset + slot's `data-start`.

Our TTS voiceovers (Gemini TTS) and Lyria BGM map directly: both go as `<audio>` elements at the host root, not inside scene sub-comps. The assembler script handles this automatically.

---

## 8. Render CLI

Node >= 22 and FFmpeg required. All commands via `npx hyperframes <command>`.

### Scaffolding

```bash
# Create a new project
npx hyperframes init my-video --example kinetic-type --resolution landscape

# Capture a live URL (downloads assets, extracts tokens.json + visible-text.txt)
npx hyperframes capture https://example.com -o ./capture
```

### Validation Gates (Run Before Every Render)

Run these in order. Each catches a different class of bug:

```bash
# 1. Static structure check: missing attrs, overlapping tracks, unregistered timelines
npx hyperframes lint

# 2. Runtime check in headless Chrome: JS errors, missing assets, WCAG contrast
npx hyperframes validate

# 3. Deep runtime check: text overflow, content outside frame, motion verification
npx hyperframes inspect

# 4. REQUIRED when using sub-compositions — captures frames at timestamps
#    The only gate that catches cross-file mount failures
npx hyperframes snapshot --at 2,6,12
```

### Preview and Development

```bash
# Hot-reload Studio editor at http://localhost:3002
npx hyperframes preview

# Lightweight player (no editor panels)
npx hyperframes play

# Agent context: returns selected element's hfId, source file, bounding box
npx hyperframes preview --context --json --context-fields selection
```

### Local Render

```bash
# Fast iteration
npx hyperframes render --quality draft

# Delivery quality
npx hyperframes render --quality high --output final.mp4

# WebM with alpha channel
npx hyperframes render --format webm

# GIF (no audio)
npx hyperframes render --format gif --fps 15

# Byte-identical across hosts (Docker)
npx hyperframes render --docker

# Parametrized render
npx hyperframes render --variables '{"headline": "Q4 Launch"}'

# Render a single sub-comp file directly (useful for testing scenes in isolation)
npx hyperframes render -c compositions/scenes/01-cold-open.html -o cold-open.mp4
```

### Cloud Render — AWS Lambda

Better for long videos (>5 min), 4K, parallel batches:

```bash
# Deploy SAM stack
npx hyperframes lambda deploy \
  --stack-name=hf-prod \
  --region=us-east-1 \
  --concurrency=8 \
  --memory=10240

# Distributed render
npx hyperframes lambda render ./my-project \
  --width 1920 --height 1080 --wait

# Tear down (S3 bucket retained)
npx hyperframes lambda destroy
```

---

## 9. Vercel Sandbox Hosted Render Architecture

The Vercel template at `/Users/prabhas/dev/hf-scratch/hyperframes-vercel-template/` is copy-paste ready for our hosted product.

### Request Flow

```
Browser  POST /api/render
  → Next.js route (maxDuration: 300s, nodejs runtime)
  → collectFiles(compositionDir)         // reads our pipeline's HTML output
  → renderInSandbox(files)
      → Sandbox.create({ source: { type: "snapshot", snapshotId }, timeout: 10min, resources: { vcpus: 4 } })
      → sandbox.writeFiles(files.map(f => ({ path: "composition/" + f.rel, content: f.content })))
      → sandbox.runCommand({ cmd: "npx", args: ["--no-install", "hyperframes", "render", "composition", "-o", "out.mp4", "--workers", "auto"] })
      → sandbox.readFileToBuffer({ path: "out.mp4" })
  → put("renders/render.mp4", mp4, { access: "public" })   // Vercel Blob
  → return { url: blob.url }
```

### Snapshot Pre-Baking

Snapshots bring restore time from ~15 min to ~100 ms. Created once per deployment at `next build` via `scripts/create-snapshot.ts`:

1. Spin up fresh `node22` sandbox.
2. `dnf install` Chromium system libs (nss, libXcomposite, pango, etc.).
3. `npm install hyperframes ffmpeg-static ffprobe-static`.
4. Symlink ffmpeg/ffprobe into `/usr/local/bin/`.
5. `npx hyperframes browser ensure` (downloads chrome-headless-shell).
6. `sandbox.snapshot({ expiration: 7 days })` — writes snapshot ID to a pointer blob at `snapshot-cache/<deployment_id>.json`.

### Adapting for Our Pipeline

Three changes from the template:

1. **Replace `PREVIEW_COMPOSITION_DIR`** with a dynamic path per user session (e.g. `/tmp/sessions/<session-id>/composition/`).
2. **Accept composition files from the LLM pipeline** instead of reading from disk. Pass the array of `{ rel, content }` objects directly into `renderInSandbox`.
3. **Return the Vercel Blob URL** to the frontend. The template already does this.

### Cost Model

At 4 vCPUs, `--workers auto` runs 3 parallel Chrome workers. A 30-90s launch video renders in ~4-8 min. Vercel Pro plans include $20/mo Sandbox credit — roughly 40-60 renders per month per $20. For higher volume, switch to AWS Lambda.

Required env vars (auto-injected on Vercel deploy):
- `BLOB_READ_WRITE_TOKEN`
- `VERCEL_OIDC_TOKEN`
- `VERCEL_DEPLOYMENT_ID`
- `VERCEL_ENV`

---

## 10. How the Art-Director LLM Emits a Valid Composition

### Required Output Shape

The LLM receives: `frame_id` (scene slug used as composition ID and filename), duration in seconds (from TTS audio timing), the scene's narration text, visual intent from the storyteller output, and word-level onset timestamps from TTS.

It outputs one self-contained sub-composition file at `compositions/scenes/<frame_id>.html`:

```html
<template id="<frame_id>-template">
  <style>
    /* ALL styles inside <template> — nothing in <head> */
    #root {
      position: absolute;
      inset: 0;
      /* base styles */
    }
    /* descendants via plain selectors — NOT classes on the root element */
    #root .headline { font-size: 120px; }
  </style>

  <div id="root"
       data-composition-id="<frame_id>"
       data-width="1920"
       data-height="1080"
       data-duration="<N>">
    <!-- ALL DOM content here -->
  </div>

  <!-- GSAP CDN inside <template> -->
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
  <script>
    (function () {
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });

      // ALL tweens here — synchronous, no async, no timers, no Math.random()

      window.__timelines["<frame_id>"] = tl;
    })();
  </script>
</template>
```

### Self-Check the LLM Applies Before Finishing

Before emitting, the LLM must verify:

1. Root is wrapped in `<template>` with a matching `data-composition-id`.
2. All `<style>` and `<script>` tags (including the GSAP CDN `<script>`) are INSIDE `<template>`.
3. Root is styled via `#root { ... }`, not via a class on the root element.
4. Every element with `class="clip"` has `data-start`, `data-duration`, and `data-track-index`.
5. The GSAP timeline is `{ paused: true }` and registered at `window.__timelines["<frame_id>"]`.
6. No `Math.random()`, `Date.now()`, `performance.now()`, or any timeline built in async code.
7. No exit tween (fade/scale out) unless this is the final scene in the video. Exit transitions are authored on the orchestrator's main timeline, not inside scene sub-comps.
8. No `<audio>` or `<video>` elements inside the sub-comp — those belong at the host root only.

### Common GSAP Patterns the LLM Should Use

**Entrance tween (use `fromTo`, not `from`):**

```js
tl.fromTo("#headline",
  { y: 48, opacity: 0 },
  { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" },
  0.2);
```

**Word-level stagger synced to TTS onset timestamps:**

```js
// word_onsets: array of seconds since scene start (from TTS word timestamps)
const words = root.querySelectorAll(".word");
const onsets = [0.00, 0.23, 0.28, 0.63, 0.78];  // from TTS
const slides = [360,  120,  60,   25,   12  ];    // px — first word carries most offset

gsap.set(words, { y: 14, opacity: 0 });
onsets.forEach((t, i) => {
  gsap.set(words[i], { x: slides[i] });
  tl.to(words[i],
    { x: 0, y: 0, opacity: 1, duration: 0.32, ease: "expo.out" },
    t);
});
```

**Finite repeat (never use `repeat: -1`):**

```js
const cycles = Math.max(0, Math.floor(clipDuration / 1.2) - 1);
tl.to("#pulse", { scale: 1.08, duration: 0.6, yoyo: true, repeat: cycles, ease: "sine.inOut" }, 0);
```

**Gradient shimmer sweep on text:**

```css
.headline.is-gradient {
  background: linear-gradient(90deg,
    #14110a 0%, #14110a 15%,
    #5a3215 25%, #c84f1c 40%, #e2b53f 55%, #2a8a7c 70%,
    #14110a 85%, #14110a 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  background-size: 300% 100%;
  background-position: 100% 0;
}
```

```js
tl.add(() => { words.forEach(w => w.classList.add("is-gradient")); }, 2.44);
tl.to(words, { backgroundPosition: "0% 0", duration: 0.6, ease: "power2.out", stagger: 0.04 }, 2.49);
```

**Scale pulse at sentence land:**

```js
tl.to(scene, { scale: 1.012, duration: 0.09, ease: "power2.out" }, 2.50);
tl.to(scene, { scale: 1,     duration: 0.28, ease: "power2.inOut" }, 2.59);
```

**Zoom-through entry with velocity-matched ease:**

```js
// Custom quadratic whose derivative at t=1 matches the linear hold rate
const entryEase = (t) => -0.806 * t * t + 1.806 * t;

tl.to("#frame", { scale: 0.88, filter: "blur(0px)", duration: 0.9, ease: entryEase }, 2.1);
tl.to("#frame", { scale: 0.80, filter: "blur(2px)", duration: 0.633, ease: "none" }, 3.0);
tl.to("#frame", { scale: 0.40, filter: "blur(16px)", duration: 0.2, ease: "expo.in" }, 3.63);
```

**Dot-matrix ambient background (CSS only, zero weight):**

```css
#root::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, rgba(244,244,240,0.025) 1px, transparent 1px) 0 0 / 34px 34px;
  pointer-events: none;
}
```

---

## 11. Worked Example: COLD_OPEN Scene (Beat-Locked Kinetic Type)

Scene archetype: the video opens with the product thesis punched in word-by-word on the beat of the first voiceover sentence. Dark background with dot-matrix texture. Warm cream serif type. Gradient shimmer fires when the final word lands.

**Inputs from the pipeline:**
- `frame_id`: `"cold-open"`
- `duration`: `6.0` (from TTS audio length + 0.5s tail)
- `narration`: "Ship a launch video in an afternoon."
- Word onsets (seconds from TTS): Ship=0.00, a=0.28, launch=0.45, video=0.72, in=1.10, an=1.32, afternoon=1.55
- Visual intent: "Large kinetic type, dark canvas, words slide in left-to-right with velocity-matched stagger. Gradient shimmer after last word. Warm cream on near-black."

**Output: `compositions/scenes/01-cold-open.html`**

```html
<template id="cold-open-template">
  <style>
    @import url("https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap");

    #root {
      position: absolute;
      inset: 0;
      width: 1920px;
      height: 1080px;
      overflow: hidden;
      background: #08090a;
    }

    /* Dot-matrix ambient texture — pure CSS, zero DOM nodes */
    #root::before {
      content: "";
      position: absolute;
      inset: 0;
      background: radial-gradient(circle, rgba(244,244,240,0.025) 1px, transparent 1px)
                  0 0 / 34px 34px;
      pointer-events: none;
      z-index: 0;
    }

    /* Radial vignette — darkens edges, draws eye to center */
    #vignette {
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse at 50% 55%, transparent 40%, rgba(0,0,0,0.5) 100%);
      pointer-events: none;
      z-index: 1;
    }

    /* Scene container: centered via GSAP xPercent/yPercent */
    #scene {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 1600px;
      text-align: center;
      z-index: 2;
      will-change: transform;
    }

    /* Lines */
    .line {
      font-family: "Instrument Serif", serif;
      font-weight: 400;
      font-size: 128px;
      line-height: 1.1;
      letter-spacing: -0.02em;
      color: #f4f4f0;
      white-space: normal;
    }

    .line-2 {
      font-style: italic;
      margin-top: 16px;
      color: #e8e2d4;
    }

    /* Words: inline-block for per-word animation */
    .word {
      display: inline-block;
      opacity: 0;
      margin: 0 0.14em;
      will-change: transform, opacity;
    }

    /* Gradient shimmer: sweeps from right (dark) to left (color) on .is-gradient */
    .word.is-gradient {
      background: linear-gradient(90deg,
        #f4f4f0 0%, #f4f4f0 10%,
        #e2b53f 28%, #c84f1c 44%, #2a8a7c 60%,
        #f4f4f0 80%, #f4f4f0 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      background-size: 300% 100%;
      background-position: 100% 0;
    }

    /* Shutter flash */
    #flash {
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse at 50% 48%, rgba(255,220,160,0.6) 0%, rgba(255,220,160,0) 60%);
      opacity: 0;
      mix-blend-mode: screen;
      pointer-events: none;
      z-index: 5;
    }
  </style>

  <div id="root"
       data-composition-id="cold-open"
       data-width="1920"
       data-height="1080"
       data-duration="6">

    <div id="vignette"></div>

    <div id="scene">
      <!-- Line 1: "Ship a launch video" -->
      <div class="line line-1">
        <span class="word" id="w-ship">Ship</span>
        <span class="word" id="w-a">a</span>
        <span class="word" id="w-launch">launch</span>
        <span class="word" id="w-video">video</span>
      </div>
      <!-- Line 2: "in an afternoon." -->
      <div class="line line-2">
        <span class="word" id="w-in">in</span>
        <span class="word" id="w-an">an</span>
        <span class="word" id="w-afternoon">afternoon.</span>
      </div>
    </div>

    <div id="flash"></div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
  <script>
    (function () {
      window.__timelines = window.__timelines || {};

      const tl = gsap.timeline({ paused: true });
      const root = document.querySelector('[data-composition-id="cold-open"]');
      const scene = root.querySelector("#scene");
      const flash = root.querySelector("#flash");

      // Anchor scene at true canvas center (GSAP manages translation)
      gsap.set(scene, { xPercent: -50, yPercent: -50 });

      // ---------------------------------------------------------------
      // Entry: composition blurs in from dark, settles by t=0.3s
      // ---------------------------------------------------------------
      gsap.set(root, { filter: "blur(18px)" });
      tl.to(root, { filter: "blur(0px)", duration: 0.35, ease: "power2.out" }, 0);

      // ---------------------------------------------------------------
      // Word-level kinetic type — TTS onset timestamps (seconds from scene start)
      // Ship=0.00 | a=0.28 | launch=0.45 | video=0.72 | in=1.10 | an=1.32 | afternoon=1.55
      // First word carries velocity-matched offset from the cut entry.
      // ---------------------------------------------------------------
      const line1 = [
        { el: "#w-ship",     t: 0.00, x: 320, y: 14 },
        { el: "#w-a",        t: 0.28, x: 100, y: 14 },
        { el: "#w-launch",   t: 0.45, x:  55, y: 14 },
        { el: "#w-video",    t: 0.72, x:  22, y: 14 },
      ];
      const line2 = [
        { el: "#w-in",        t: 1.10, x: 18, y: 14 },
        { el: "#w-an",        t: 1.32, x: 12, y: 14 },
        { el: "#w-afternoon", t: 1.55, x:  8, y: 14 },
      ];

      [...line1, ...line2].forEach(({ el, t, x, y }) => {
        gsap.set(el, { x, y, opacity: 0 });
        tl.to(el, { x: 0, y: 0, opacity: 1, duration: 0.32, ease: "expo.out" }, t);
      });

      // ---------------------------------------------------------------
      // Gradient shimmer — fires 0.22s after "afternoon." lands
      // Sweeps color band from right to left across all words
      // ---------------------------------------------------------------
      const allWords = root.querySelectorAll(".word");
      tl.add(function () {
        allWords.forEach(function (w) { w.classList.add("is-gradient"); });
      }, 1.77);
      tl.to(allWords, {
        backgroundPosition: "0% 0",
        duration: 0.65,
        ease: "power2.out",
        stagger: 0.03,
      }, 1.82);

      // Scale pulse confirms the landing
      tl.to(scene, { scale: 1.014, duration: 0.09, ease: "power2.out" }, 1.83);
      tl.to(scene, { scale: 1,     duration: 0.30, ease: "power2.inOut" }, 1.92);

      // Warm shutter flash on the pulse peak
      tl.to(flash, { opacity: 1, duration: 0.08, ease: "power3.in"  }, 1.83);
      tl.to(flash, { opacity: 0, duration: 0.32, ease: "power2.out" }, 1.91);

      // ---------------------------------------------------------------
      // Hold (2.2 → 5.5s): text breathes — letter-spacing micro-oscillation
      // on the italic line keeps the frame alive without distracting
      // ---------------------------------------------------------------
      tl.to("#w-afternoon", {
        letterSpacing: "-0.015em",
        duration: 0.6,
        ease: "sine.inOut",
        yoyo: true,
        repeat: 1,
      }, 3.8);

      // ---------------------------------------------------------------
      // Exit (5.5 → 6.0s): scene fades and scales up slightly
      // The next scene's sub-comp takes over via host orchestrator timing
      // ---------------------------------------------------------------
      tl.to(root, {
        opacity: 0,
        scale: 1.04,
        filter: "blur(4px)",
        duration: 0.5,
        ease: "power2.in",
      }, 5.5);

      window.__timelines["cold-open"] = tl;
    })();
  </script>
</template>
```

**Validation sequence for this file:**

```bash
# Lint the project
npx hyperframes lint

# Validate runtime (JS errors, missing fonts)
npx hyperframes validate

# Snapshot at the key moments
npx hyperframes snapshot --at 0.5,1.5,2.0,4.0,5.8

# Render the scene in isolation to check timing before full assembly
npx hyperframes render -c compositions/scenes/01-cold-open.html -o cold-open-preview.mp4 --quality draft
```

---

## 12. Pipeline Integration Summary

Our pipeline maps to HyperFrames as follows:

| Our pipeline stage | HyperFrames artifact |
|--------------------|----------------------|
| Storyteller LLM → scene JSON (description, duration, narration) | `STORYBOARD.md` frame blocks |
| Art-director LLM → visual HTML per scene | `compositions/scenes/<frame_id>.html` sub-comps |
| Gemini TTS output (audio file + word timestamps) | `<audio>` at host root + word onset cues fed to LLM |
| Lyria BGM | `<audio>` at host root, track 11 |
| Assembler step | `assemble-index.mjs` → `index.html` orchestrator |
| Render backend | Vercel Sandbox → `npx hyperframes render` → Vercel Blob URL |

The only new abstraction is the sub-comp HTML schema. Everything else (scene duration, narration, visual intent) already exists in our scene JSON. The art-director LLM's system prompt needs: the required template shape from section 10, the banned patterns from section 6, and a few `fromTo`/stagger examples as few-shot anchors. The `thesis.html` composition at `/Users/prabhas/dev/hf-scratch/hyperframes-launches/hyperframes-launch/compositions/thesis.html` is the gold-standard reference — 232 lines, production-shipped, covers the full kinetic-type pattern end-to-end.
