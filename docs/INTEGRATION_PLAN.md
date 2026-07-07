# INTEGRATION_PLAN.md — Launch Studio × HyperFrames

> Written: July 7, 2026. Solo founder, working Remotion pipeline, HyperFrames Apache 2.0 now evaluated.
> This document supersedes `HYPERFRAMES_DECISION.md` for build planning.

---

## 0. Context in One Paragraph

We have a working CLI pipeline: `ingest.mjs` → `storyteller.mjs` → `director.mjs` → `voiceover.mjs` → `gen-music.mjs` → Remotion Lambda render. The grammar schema (6 archetypes, Zod-typed, LLM emits JSON, engine executes) is the right architectural shape. HeyGen just open-sourced HyperFrames (Apache 2.0): HTML/CSS/GSAP → deterministic MP4 via headless Chrome + FFmpeg, with Vercel Sandbox cloud render, a browser Studio editor, and a catalog of 50+ installable scene blocks. This document answers: should we re-platform the render engine onto HyperFrames for the hosted product, or wrap the existing Remotion pipeline? It then gives the phased build plan, the A/B test, and licensing guardrails.

---

## 1. The Recommendation

**Run the A/B test first. Build the async job infrastructure in parallel. Do not rewrite Remotion scenes before the test result is in hand.**

If HyperFrames output is clearly better on the leadverse.ai test → migrate the render layer to HyperFrames for the hosted product. The brain (storyteller, director, crawler, TTS, music) ports unchanged.

If Remotion output holds → ship the hosted product wrapper on Remotion Lambda, and adopt HyperFrames registry blocks selectively as new scene archetypes.

Either path is viable. The A/B test is the empirical gate, not a strategic question we can answer by reasoning alone. What follows gives the full context to execute either branch.

---

## 2. Honest Tradeoffs

### 2a. Keep Remotion + Wrap

| Consideration | Verdict |
|---|---|
| Pipeline working today | The strongest argument. Nothing to rewrite, nothing to break. |
| React/TypeScript scene components | Natural for this stack. HookScene.tsx, PainScene.tsx, etc. are readable and debuggable. |
| Remotion Lambda operational | Cloud render already works. Wrap it with a job queue and web UI and you have a hosted product. |
| Scene variety ceiling | 6 archetypes. Adding a 7th requires writing a new React component. Slower iteration than HF blocks. |
| LLM emitting React/JSX | Harder to prompt for than plain HTML. Director must emit a JSON grammar that the engine interprets — which is the right pattern, but more indirection. |
| Remotion commercial licensing | Source-available, free for solo founder now, but there is a threshold. Apache 2.0 (HF) has no threshold ever. Not urgent, but it will matter at scale. |
| Quality ceiling | Our current 5-scene Remotion output is basic. The HF production examples (13 launch videos) show a significantly higher visual ceiling. Closing the gap requires writing more sophisticated React scene components, which is days of work per archetype. |

### 2b. Re-platform Render Layer to HyperFrames

| Consideration | Verdict |
|---|---|
| Rewrite cost | 1-2 weeks to port all 6 scene archetypes from React TSX to HTML/GSAP sub-compositions. Not trivial for a solo founder. |
| Determinism footguns | The hardest gotcha. `Math.random()`, `Date.now()`, `async` timeline builds, and `<style>` outside `<template>` all produce silent bugs that lint and validate miss. LLM prompts must encode these as negative examples explicitly. |
| Sub-comp gotchas | `#root` must be styled via `#root` selector, not a class on the element (CSS drops class-keyed rules in composited render). Host `data-composition-id` must exactly match the inner template's `data-composition-id`. Media elements must be direct children of the host root, never inside a sub-comp. Three silent failure modes that pass preview but break render. |
| Vercel Sandbox vs Lambda | Sandbox eliminates the AWS account, SAM stack, and S3 bucket. One `vercel deploy` at deploy time bakes Chromium + FFmpeg + hyperframes into a 1.1 GB snapshot (~100ms restore at render time). Simpler ops for a solo founder already on Vercel. |
| 50+ registry blocks | Pre-validated, pre-tested sub-compositions: transitions, captions, data-viz, code snippets, lower-thirds, VFX, liquid glass. Variety that would take weeks to write in React comes free. This is the strongest argument for HF. |
| HTML = LLM-native | Plain HTML with 10 `data-*` attributes is easier to prompt against than React JSX. The art-director only needs to know `data-composition-id`, `data-start`, `data-duration`, `data-track-index`, and `window.__timelines[id] = tl`. |
| Browser Studio editor | `npx hyperframes preview` gives a hot-reload timeline editor the user can inspect. Translates to a "preview before you render" UX feature in the hosted product. |
| Apache 2.0 | No licensing ceiling ever. Build commercially on top, keep additions closed, must keep copyright notices, cannot use HeyGen/HyperFrames name in marketing. |
| 7-day snapshot expiry | Production requires a new deploy at least every 7 days or `restoreOrCreate()` throws with no fallback. For a solo founder who may go 10 days without touching the codebase, this is a real operational risk. Guard with a deploy cron or Vercel `redeploy` webhook. |
| Async job queue mandatory | 30-90s videos render in 4-8 minutes on a 4-vCPU Vercel Sandbox. The HTTP Function maxDuration is 300s on Pro, 800s on eligible Pro. A 60s video likely exceeds 300s. Need QStash/Upstash job queue regardless — this is infrastructure that must be built either way. |

### The Decisive Asymmetry

The moat — storyteller specificity, villain-framed narrative, real-numbers-only discipline, curated taste — is 100% engine-agnostic. It lives in `storyteller.mjs`, `director.mjs`, the system prompts, and the scene grammar JSON schema. None of it changes regardless of whether the render layer is Remotion or HyperFrames.

The engine question is purely about: (a) quality ceiling per engineering hour, (b) operational complexity, and (c) future block velocity. The A/B test provides evidence for (a). HyperFrames wins (b) and (c) on paper. But the test result can override the paper case.

---

## 3. What Ports Over Unchanged, Either Way

These are the non-negotiables that are already done and never need rewriting:

**`scripts/ingest.mjs`** — Playwright crawler, hero + 5 scroll shots + mobile, brand color extraction from CTA elements, meta + full text. Works against any URL. Engine-agnostic. Keep as-is.

**`scripts/storyteller.mjs`** — The villain-framed narrative engine. 6-scene structure (COLD_OPEN through CTA_COMPRESSION), 67-word budget, banned superlatives list, deterministic critic function, quality_checks in JSON output. This is the primary moat. Zero changes either way.

**`scripts/director.mjs`** — Art direction: style pack selection, accent color extraction, scene variant choices, on-screen copy specificity rule, `vo` line per scene, screenshot path selection. The JSON output schema maps to either a Remotion `FilmSchema` or a HyperFrames STORYBOARD.md `frames[]` array — one thin adapter layer at the output step, nothing internal changes.

**`scripts/voiceover.mjs`** — Gemini TTS (Charon voice, situational direction, per-scene AUDIO_PROFILE + SCENE_CONTEXT). Outputs `.wav` files to `public/vo/<domain>/`. Either engine picks up these audio files. Engine-agnostic.

**`scripts/gen-music.mjs`** — Lyria BGM generation. Outputs `public/music/<domain>/bgm.mp3`. Either engine embeds this as the underscore. Engine-agnostic.

**Scene grammar JSON schema** (`src/remotion/grammar/schema.ts`) — The 6-archetype discriminated union (ColdOpen, PainTypography, ProductHero, FeatureWalk, StatCallout, CtaCompression) with Zod. This schema is the director's contract. If we migrate to HF, the schema stays; only the renderer that consumes it changes.

**All runs data** (`runs/<domain>/`) — factsheet.json, story.json, film.json, audio files. Accumulated research and generated assets. Portable.

**`src/remotion/launch/fx.tsx`** — Grain, GridDots, GlowOrb, LightSweep, Vignette. If staying on Remotion, keep. If migrating to HF, the same techniques are available as pure CSS: dot-matrix via `radial-gradient`, grid via `linear-gradient`, glow as radial gradient on a `::before` pseudo-element. The HF production examples implement all of these in 3-5 CSS lines each.

---

## 4. Phased Build Plan — Hosted Product

The goal: paste a URL into a web form, receive an MP4 URL. Non-developer accessible. The phases below apply regardless of engine, with engine-specific branches called out.

### Phase 0: Empirical Gate (Week 1, concurrent with Phase 1)

Run the A/B test (full spec in Section 5). Result expected within 3-4 days of starting. Do not block Phase 1 on this.

### Phase 1: Hosted Product v1 on Current Engine (Weeks 1-3)

Ship the simplest thing that is a real product. The Remotion pipeline is working — wrap it.

**Web intake form** (`/` route, Next.js app): URL input field, email field (for delivery notification), submit → `POST /api/jobs`. No auth for v1.

**Job row in Supabase** (`jobs` table): `id` (uuid), `url`, `email`, `status` (queued / crawling / scripting / voicing / rendering / done / failed), `result_url` (nullable blob URL), `created_at`, `updated_at`. Polling endpoint: `GET /api/jobs/[id]` → `{ status, result_url }`.

**Async pipeline via Upstash QStash**: POST /api/jobs enqueues to QStash → `/api/workers/crawl { jobId, url }` (300s maxDuration) runs ingest + storyteller + director + voiceover + music → update status to `rendering` → enqueue to `/api/workers/render { jobId }`.

**Render worker** (`/api/workers/render`, maxDuration 800s on Pro):
- Remotion branch: call Remotion Lambda render, poll for completion, retrieve S3 MP4 URL, upload to Vercel Blob (or serve S3 URL directly), update job row.
- HyperFrames branch (if A/B favors HF): call `renderInSandbox(compositionFiles)` from the Vercel template's `lib/sandbox.ts`, get Vercel Blob URL, update job row.

**Polling page** (`/jobs/[id]`): Shows status in real time with a progress bar (fake progress on known timing estimates). When done, shows the MP4 in a `<video>` player and a download link. Email delivery via Resend when `result_url` is set.

**Billing gate**: Before crawl starts, charge via Dodo. Single product: $19/video or $29/3-pack. No trial for v1 — the render costs are real ($1-2/render on Vercel Sandbox, similar on Lambda).

Timeline: 3 weeks if scope is held to the above. No auth, no dashboard, no history. One URL in, one MP4 out.

### Phase 2: Quality + Engine Lock (Weeks 4-8)

By the end of Phase 1, the A/B result is in hand. Act on it.

**If HyperFrames wins the A/B test:**

Migrate the render layer. Keep all Phase 1 infrastructure (Supabase, QStash, web UI). Replace only the render worker.

Step 1: Fork `hyperframes-vercel-template/lib/sandbox.ts` and `scripts/create-snapshot.ts` into the launch-studio project. Add the snapshot creation to `package.json`'s build step (it runs at `vercel build` time).

Step 2: Write `src/composer/index.ts` — the function that takes a `FilmSchema` (our director's JSON output) and returns `Array<{ rel: string; content: Buffer }>` — the composition file set that `renderInSandbox()` expects. Each scene archetype maps to a sub-composition template (HTML + GSAP). The orchestrator `index.html` is assembled by a port of `assemble-index.mjs`.

Step 3: Encode the determinism rules into the composition templates (no `Math.random`, no `Date.now`, no async timelines, `fromTo` not `from`, `#root` not class, `<template>` wrapper). These are fixed in the template code, not prompted against — the LLM never writes raw GSAP.

Step 4: Wire audio. TTS `.wav` files go as `<audio>` elements at the host root with `data-start` = cumulative scene offset. BGM `.mp3` goes as a second `<audio>` at track 11. Media is never inside a sub-comp `<template>`.

Step 5: Run `npx hyperframes lint && npx hyperframes validate && npx hyperframes snapshot --at 2,6,12` in the render worker before calling `renderInSandbox`. Gate render on zero errors. This prevents spending sandbox compute on broken compositions.

Step 6: Set `maxDuration = 800` on the render route (requires Vercel Pro). Videos up to ~60s will fit. Above that, use the Lambda distributed path (`hyperframes lambda render --wait`).

**If Remotion holds (output comparable to HF):**

Upgrade the existing scenes using techniques harvested from HyperFrames production examples, without migrating the engine.

- Add 3 new scene archetypes as React TSX components. Candidates: `CAPABILITY_REEL` (hard smash-cut grid of product clips, 0.8-3.5s per clip), `STAT_EXPLOSION` (number punches in word-by-word with gradient shimmer), `BEFORE_AFTER` (split screen with the villain labeled and struck through).
- Port the GSAP proxy pattern for WebGL shaders to a Remotion `useRef` + `useCurrentFrame` equivalent. Remotion's frame counter replaces GSAP's timeline scrub: `const time = frame / fps`.
- Install 3-5 HyperFrames registry blocks as standalone HTML compositions rendered via a Remotion `<IFrame>` component with a `src` pointed at an on-demand composition serve route. This is the hybrid path: Remotion orchestrates, HF blocks execute inside iframes that Remotion captures.

### Phase 3: Scale + Catalog (Weeks 9-16)

Regardless of engine:

- **User dashboard**: history of renders, re-download, re-render with different style pack.
- **Style pack selection**: editorial cream (light, warm, Inter) / dark terminal (near-black, SF Mono) / brand-matched (accent pulled from the crawled URL). Director already emits `stylePack` in film.json.
- **Preview before render**: show a contact-sheet grid (static keyframes, one per scene) before charging and rendering. On HyperFrames, this is `npx hyperframes snapshot --at <scene-starts>`. On Remotion, call `renderStillOnLambda` for each scene midpoint.
- **Registry block catalog**: expose the 50 HF blocks as UI-selectable "scene templates" the director can pick from. The director's JSON output includes a `block_id` field alongside `type`; the composer resolves it to an `npx hyperframes add` installed block. This is the vault model: 80% registry blocks + 20% bespoke LLM-authored compositions.
- **Critique loop**: after render, run a machine critique (contrast ratios via WCAG check, legibility floor check at 1.4vw, motion amplitude verification, first-frame motion before 0.2s). Surface issues as resolvable before the user sees the video.

---

## 5. The A/B Test

### Design

**Subject**: leadverse.ai (already has a factsheet in `runs/leadverse.ai/`, so ingest cost is zero).

**Our v8 render** (already exists or rebuild if stale):
```bash
node scripts/storyteller.mjs leadverse.ai
node scripts/director.mjs leadverse.ai
node scripts/voiceover.mjs leadverse.ai
node scripts/gen-music.mjs leadverse.ai
# then Remotion render
npx remotion render leadverse.ai out/leadverse-v8.mp4
```

**HyperFrames render** using their `/product-launch-video` skill in `~/dev/hf-scratch`:
```bash
cd ~/dev/hf-scratch
# in a new project dir:
npx hyperframes init hf-leadverse --example blank
# then run the skill:
# npx skills run product-launch-video --url https://leadverse.ai
# this runs their full pipeline: capture → storyteller → frame-workers → assemble → render
npx hyperframes render hf-leadverse -o out/leadverse-hf.mp4
```

Watch both renders back-to-back. Evaluate on:

1. **Hook strength** (first 4 seconds): Does the opening land? Is the villain specific? Or is it generic?
2. **Visual variety per beat**: Does each scene feel like a different visual universe, or do they all look the same?
3. **Typography quality**: Legible at 1080p? Distinctive per scene? Any font monotony?
4. **Motion quality**: Is motion visible and intentional? Or subtle and reads as static?
5. **Specificity test**: Are real numbers from the leadverse.ai factsheet used? Or invented claims?
6. **Audio integration**: Does the music build, swell, and resolve? Or flat loop?
7. **Total visceral reaction**: Would you share this on X?

### What the Result Implies

**HyperFrames wins clearly (3+ of the 7 criteria decisively better):**

Re-platform the render layer. The quality gap is real and closing it in Remotion requires weeks of scene-component work that the HF block catalog gives for free. The engine migration cost (1-2 weeks) is lower than the quality debt.

Concrete path: Phase 2 migrates to HF Vercel Sandbox. The async job queue (QStash) stays. The brain (storyteller, director, TTS, music) stays. The only change is replacing Remotion Lambda with `renderInSandbox()` and replacing React TSX scene components with HTML/GSAP sub-compositions assembled from registry blocks.

**Remotion holds (HF is comparable or only marginally better):**

No migration. The engine quality is not the bottleneck — distribution is. Stay on Remotion Lambda, ship the hosted product wrapper in Phase 1, add HF techniques (GSAP patterns, transition vocabulary, CSS texture recipes) to the existing React components incrementally.

The registry blocks are still valuable: install 3-4 via `npx hyperframes add` and run them inside Remotion `<IFrame>` components for scenes where the HF block is clearly better (e.g., `code-typing`, `data-chart`, `lt-soft-pill` lower thirds). This is the surgical hybrid path.

**HyperFrames is worse (narrative weaker, less specific):**

This validates the moat. Their `/product-launch-video` skill produces something, but our storyteller brain (villain-framed, real-numbers-only, 67-word budget discipline) produces better narrative. Keep Remotion, do not migrate. Use the HF research to upgrade our scene components' visual sophistication only.

---

## 6. Licensing Guardrails

### HyperFrames Framework (Apache 2.0)

The `heygen-com/hyperframes` repository is Apache 2.0 (changed from MIT in PR #183). Apache 2.0 permits: commercial use, modification, private forks, sublicensing. Requirements: preserve copyright notices in distributed copies, include the Apache 2.0 license text in any distribution, state changes if distributing modified source.

For our hosted product: we are building a commercial service on top of HyperFrames. This is explicitly permitted. We do not distribute the framework to end users (they submit a URL and receive an MP4) — this is a service, not a distribution. We must not use the "HyperFrames" or "HeyGen" name in our product marketing. The render engine is an implementation detail; our product name is Launch Studio.

We do NOT need to open-source our additions (storyteller prompts, director logic, composition templates, web UI). Apache 2.0 does not require derivative works to be open-sourced (that is GPL's requirement, not Apache's).

Practical action: Copy `hyperframes-vercel-template/lib/sandbox.ts` and `hyperframes-vercel-template/scripts/create-snapshot.ts` into our project. Keep the Apache 2.0 copyright headers at the top of these files.

### HyperFrames Launches Repo (NO LICENSE)

The `hyperframes-launches` repository has no license file. Under copyright law, all-rights-reserved is the default when no license is stated. This means: **no permission to copy, fork, or distribute its code or assets (including the LFS media files)**.

What we can do (legally, everywhere):
- Study the techniques. Animation patterns, seam grammar, storyboard field schema, GSAP parameter choices — these are methodology, not copyrightable expression.
- Read the SCRIPT.md and STORYBOARD.md files and apply the craft principles to our own prompts and pipeline.
- Implement the same effects from scratch in our own code. A domain-warp FBM shader is a mathematical function, not copyrightable. We write our own implementation.

What we cannot do:
- Copy any HTML file from hyperframes-launches into our composition library.
- Copy any `.mp3`, `.png`, `.mp4` asset from the LFS store.
- Paste GSAP code blocks from their composition files into our templates.

Practical enforcement: the `~/dev/hf-scratch/hyperframes-launches/` directory is a research reference only. Nothing from it goes into `launch-studio/src/` or `launch-studio/scripts/`. The patterns we adopt are re-implemented from scratch.

### Remotion (Current Engine)

Remotion is source-available, not open source. The free tier is limited: the threshold for a paid company license is defined by Remotion's current pricing terms (check `remotion.dev/license` before scaling). For a solo founder in pre-revenue phase this is not immediately urgent, but Apache 2.0 (HyperFrames) has no such threshold ever. This asymmetry grows more relevant as the hosted product scales.

---

## 7. The Adapter Layer (Engine-Agnostic Architecture)

Whether we stay on Remotion or migrate to HyperFrames, the director's JSON output is the contract. The adapter layer is the only code that changes between engines.

```
URL
  └─→ ingest.mjs         → factsheet.json         [SHARED, engine-agnostic]
  └─→ storyteller.mjs    → story.json              [SHARED, engine-agnostic]
  └─→ director.mjs       → film.json (FilmSchema)  [SHARED, engine-agnostic]
  └─→ voiceover.mjs      → vo/*.wav                [SHARED, engine-agnostic]
  └─→ gen-music.mjs      → bgm.mp3                 [SHARED, engine-agnostic]
  └─→ [ADAPTER LAYER]
        Remotion branch:  film.json → React TSX props → Remotion Lambda render
        HyperFrames branch: film.json → HTML sub-comps + index.html → renderInSandbox()
  └─→ MP4 → Vercel Blob → blob.url
```

The adapter layer for HyperFrames is a single function: `composeFromFilm(film: FilmSchema): Array<{ rel: string; content: Buffer }>`. It maps each scene type to a sub-composition HTML template, parametrizes it with the scene's JSON content, and returns the file tree that `renderInSandbox()` consumes. The orchestrator `index.html` is assembled last, wiring sub-comp slots and audio elements. Audio elements (`<audio data-track-index="10">` for VO, `<audio data-track-index="11">` for BGM) are always at the host root, never inside sub-comps.

This adapter is the only file that differs between engines. The entire brain pipeline above it is identical.

---

## 8. Async Job Queue Architecture (Required Regardless of Engine)

A 30-second video renders in 4-8 minutes. A Vercel Function HTTP request must complete within 300s (Pro) or 800s (Enterprise-eligible Pro). Both paths require an async job queue.

The pattern is the same on either engine:

```
POST /api/jobs { url }
  → create Supabase row (status='queued')
  → enqueue QStash message to /api/workers/pipeline { jobId, url }
  → return { jobId }

/api/workers/pipeline (maxDuration=300, chained steps):
  → ingest (Playwright or Firecrawl API — avoid running Playwright in a Vercel Function,
             use Firecrawl API to keep the crawl step serverless and fast)
  → storyteller LLM (Claude Haiku or Gemini Flash — fast, cheap)
  → director LLM (Claude Sonnet or Gemini Pro — better creative choices)
  → TTS (Gemini TTS — per-scene, parallel requests)
  → music (Lyria — one request)
  → upload all audio to Vercel Blob, store URLs in Supabase
  → update status='rendering'
  → enqueue QStash to /api/workers/render { jobId }

/api/workers/render (maxDuration=800):
  → load composition files (from Supabase + Blob URLs)
  → renderInSandbox(compositionFiles) [HF] OR renderOnLambda(filmJson) [Remotion]
  → put MP4 to Vercel Blob
  → update job row (status='done', result_url=blob.url)
  → send email via Resend
```

Supabase `jobs` table DDL:
```sql
create table jobs (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  email text,
  status text not null default 'queued',
  result_url text,
  film_json jsonb,
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

Client polls `GET /api/jobs/[id]` every 5 seconds. No websockets needed for v1.

---

## 9. Cost Model

| Line item | Cost | Notes |
|---|---|---|
| Vercel Sandbox render (~6 min, 4 vCPU) | ~$1.20 | $0.05/min × 4 vCPU × 6 min |
| Vercel Pro $20/mo Sandbox credit | ~17 renders included | Roughly 17 videos/mo before pay-as-you-go |
| Remotion Lambda render (alternative) | ~$0.80-1.50 | Lambda pricing varies; similar order of magnitude |
| Gemini TTS per video | ~$0.01-0.05 | 6 VO lines, short |
| LLM pipeline (storyteller + director) | ~$0.05-0.15 | Claude Haiku + Sonnet mix |
| Firecrawl API per URL | ~$0.01 | First-page crawl |
| Vercel Blob storage per MP4 | ~$0.03-0.05/GB | Persistent, public CDN |
| Total COGS per render | ~$1.50-3.00 | |

At a $19/video price point, gross margin is ~84-92%. At $29/3-pack ($9.67/video), it's ~68-84%. Both are healthy for a solo SaaS product at this stage.

---

## 10. First Actions After Reading This Document

1. Run the A/B test (Section 5). This is the highest-leverage decision-maker. Takes ~4 hours.
2. Set up Supabase `jobs` table and `GET /api/jobs/[id]` polling route. Engine-agnostic infrastructure; do this now regardless of test result.
3. Sign up for QStash (Upstash free tier covers the first 500 messages/day). Wire `POST /api/jobs` to enqueue.
4. Sign up for Firecrawl API. Replace the Playwright-in-function crawl with a Firecrawl API call in the pipeline worker. This eliminates Chromium-in-lambda complexity from the crawl step (Playwright stays only in local `ingest.mjs` for dev).
5. After the A/B test result: branch into either the HF migration (Phase 2A) or the Remotion wrapper (Phase 2B) as described in Section 4.

The storyteller brain is the product. The engine is infrastructure. Ship the hosted wrapper first. Migrate engines only if the quality delta earns it.
