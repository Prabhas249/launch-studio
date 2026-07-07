# THE PLAYBOOK: From Competent to Market-Breaking AI Launch Videos

---

## PART 1 — THE 10 HIGHEST-LEVERAGE SECRETS

### #1 — The Beat-Quantized 15-Archetype Scene Grammar Is Your Director Contract

**What it is.** Every scene the director LLM emits carries `duration_beats` (integer at 120BPM, where 1 beat = 0.5s = 15 frames at 30fps) and `scene_type` from a 15-name enum: COLD_OPEN, PAIN_TYPOGRAPHY, BEFORE_STATE, PRODUCT_HERO, FEATURE_WALK, STAT_CALLOUT, SOCIAL_PROOF, LOGO_MOMENT, INTEGRATION_GRID, WORKFLOW_CASCADE, COMPARISON_SPLIT, BROWSER_CHOREOGRAPHY, BENTO_EXTRACTION, CTA_AMBIENT_LOOP, CTA_COMPRESSION. The canonical 30s sequence locks to: beats 0-8 COLD_OPEN → 8-16 PAIN_TYPOGRAPHY → 16-24 PRODUCT_HERO → 24-36 FEATURE_WALK → 36-40 STAT_CALLOUT → 40-46 SOCIAL_PROOF → 46-54 BROWSER_CHOREOGRAPHY → 54-60 CTA_COMPRESSION. Music crash (bass hit SFX) lands at beat 32 / bar 8 / second 16, synchronized with STAT_CALLOUT entry.

**Implementation.** In Remotion: `durationInFrames = duration_beats * fps * 60 / bpm = duration_beats * 15` at 120BPM/30fps. The director LLM receives the crawled website copy, Playwright screenshots, and any social proof. It receives Remotion's system prompt from `remotion.dev/llms.txt` in context. It outputs structured JSON validated against a Zod schema enforcing all 15 `scene_type` values. Use Vercel AI SDK `generateObject()` with the Zod schema to get first-try valid JSON — no retry loop. The composition reads `inputProps` containing this JSON. Per-scene platform rule: director must validate `meta.platform` against per-archetype `allowed_platforms` arrays (BROWSER_CHOREOGRAPHY forbidden on 9:16 portrait because a 1440px window renders UI text illegible).

**Effort: 3 days.** This is the skeleton every other secret attaches to. Build it first.

---

### #2 — 15 Frames Per Beat Is the Single Calculation That Separates Amateur Cuts From Professional Ones

**What it is.** At 120BPM/30fps: 1 beat = 15 frames. 1 bar = 60 frames. 30s = 900 frames = 60 beats. All scene cuts, SFX triggers, typography entries, and camera moves must land on multiples of 15 (beat boundaries) or multiples of 60 (bar boundaries). A 400ms duration = 12 frames, missing the beat grid — this is exactly why generalist code feels "slightly off." The correct API call: `secondsToFrames(beatCount * 0.5, 30)` or simply `beatCount * 15`.

**Implementation.** Add a `assertBeatAligned(frame: number): void` utility that throws if `frame % 15 !== 0` and call it on every Sequence `from={}` prop during dev. During the critique loop, run a programmatic preflight before invoking the VLM judge: `cutOffsetMs = cutTimeMs % 500`. If `cutOffsetMs > 125` (more than a quarter-beat off), flag it in the preflight report passed to the judge as text. For SFX audio synthesis: 1 beat = 22050 samples at 44100Hz — use this for ffmpeg filter_complex positioning.

**Effort: 0.5 days.** Pure arithmetic, but it must be enforced programmatically or it silently degrades.

---

### #3 — Three Typography Primitives Cover 90% of the Genre's Visual Language

All three are Remotion-native and combine for the Skale/ListenLabs/MagicPath aesthetic.

**A. overflow:hidden line-mask (AE "Position from Below baseline").** Wrap each word in a `div { overflow: hidden; lineHeight: '1.1em'; height: '1.1em' }`. Inner span starts at `translateY(100%)` and springs to `translateY(0)`. Spring preset for editorial: `{ stiffness: 120, damping: 14 }`. Stagger: `delay = index * 8` frames. This is the "rising from floor" look — without the overflow clip it's just an opacity fade and reads cheap.

**B. Clip-path wiper block (AE "Linear Wipe").** `clipPath: inset(0 ${100-clipX}% 0 0)` where clipX springs from 0→100 with `{ damping: 30, stiffness: 60 }`. A solid-color div at the same background color sweeps left-to-right then exits at blockX > 100. Without the wiper div you get text appearing from nothing; with it you get the ink/print reveal. Background color must match exactly.

**C. Blur-dissolve word carousel (the definitive genre signature).** Per word: `opacity: interpolate(frameInWord, [0, 15, 45, 60], [0, 1, 1, 0])`, `scale: interpolate([0, 15, 45, 60], [0.8, 1, 1, 1.2])`, `blur: interpolate([0, 15, 45, 60], [10, 0, 0, 10])`. Apply as `filter: blur(${blur}px)` on the span, not on a parent. The 0.8→1→1.2 scale (subtle growth during hold) is the detail that makes it float — without it the hold looks static. Layout anchor: a `visibility: hidden` div with the longest word reserves fixed space; the visible word is `position: absolute`.

**Spring config reference:**
- Snappy SaaS UI pop: `{ stiffness: 200–300, damping: 10–12, mass: 0.5 }`
- Premium editorial: `{ stiffness: 40–80, damping: 20–30 }`
- Standard enter (most-used): `{ stiffness: 120, damping: 14 }`
- Logo bounce: `{ stiffness: 150–200, damping: 8–12 }`
- Snappy UI for demo: `{ stiffness: 80, damping: 12, mass: 0.8, overshootClamping: true }` — 8–10% overshoot, settles in 0.4s

**Effort: 1 day total** to build all three as reusable vault components.

---

### #4 — The VLM Critique Loop: Two-Tier Judge + Cut-Aligned Contact Sheet + 3-Iteration Hard Cap

**What it is.** The critique loop has three distinct pieces that must all be right simultaneously.

**The contact sheet.** Do not send the full video or uniform frame samples. Extract: frame 0, frame N-1, frame[cut-2] and frame[cut+2] for every scene boundary, plus frames at every 4th beat mark (frames 60, 120, 180... = every 2s). For a typical 8-scene 30s video this yields ~27 frames — inside Gemini's practical context and under Claude's 100-image limit. Send each as a separate image content block with a text label (`Frame 007 at t=0.23s, pre-cut Scene 3:`). Do not composite into a single grid PNG — VLMs perform better on separately-submitted labeled images. Extract via `renderStill({ composition, frame: n, output, imageFormat: 'png' })` and parallelize with `Promise.all()`.

**The judge tier.** Iteration 1 and 2: Gemini 2.5 Flash at $0.30/M input tokens (~$0.002/call for a 27-frame contact sheet). Iteration 3 / final gate: Gemini 2.5 Pro at $1.25/M. Do not use Claude Sonnet for the iteration loop: Claude charges per 28×28px patch (~$0.004/image × 26 frames × 3 iterations = $0.31/video vs. $0.006 for Gemini Flash). If you use Claude anywhere in the judge, use the Files API (beta header `files-api-2025-04-14`) to upload images once and reference by `file_id` across multi-turn critique turns.

**The iteration budget.** Hard cap: 3 iterations. Early-exit: if all 5 dimension scores ≥ 4 after iteration 1, accept. Delta gate: if total score improvement across all 5 dimensions < 2 points from iteration 1→2, accept current best. BACKTRACK (not just continue): maintain a `{scene_json, scores, iteration}` version history — if iteration N scores worse than N-1 on more than 2 dimensions, revert to N-1 and try a different revision instruction. If `SPECIFICITY_DENSITY ≤ 2` after iteration 2, trigger RESTART (not revision) — send the director agent back to script generation with a hard constraint. This is a data-availability problem, not a rendering problem.

**The scoring format.** XML `<thinking>` block first (chain-of-thought over specific labeled frames), then a JSON block: `{ score: 1-5, frame_evidence: "frame_007...", worst_instance: "...", best_instance: "...", revision_priority: 1-3 }` per dimension. The `worst_instance` field is not cosmetic — it's what enables the orchestrator to map the critique frame back to a `scene_id` (via `mapFrameToSceneId(filename, sceneJson)` parsing the timestamp from the filename) and emit a typed patch targeting `scenes[2].typography.headlineSize` rather than "make text bigger."

**Effort: ~7 days total** across the contact sheet extractor (1d), judge wiring (1d), rubric + scoring format (2d), revision instruction schema (2d), backtrack logic (1d).

---

### #5 — The 5-Dimension Rubric That Matches the Genre (Not Generalist Video Quality Benchmarks)

Published rubrics (VideoScore, EvalCrafter) measure generative realism — irrelevant for editorial motion design that deliberately breaks those conventions. These 5 dimensions are reverse-engineered from the Skale/ListenLabs genre:

1. **TYPE SCALE COURAGE** — at least one frame has a single word/phrase at ≥70% of frame height, all other text subordinated below 20% size. Score 1 if headline and body are within 1.5x of each other.
2. **SPECIFICITY DENSITY** — every text hold must contain a numeric claim ("3.2x", "< 60s") or a named proper noun. Score 1 if any frame shows "powered by AI" or "streamline your workflow." This is the veto dimension: ≤ 2 on iteration 2 triggers a pipeline RESTART.
3. **HOLD-THEN-SNAP RHYTHM** — contact sheet must clearly show alternating dense-motion and near-identical hold frames at 15-frame intervals. The preflight check computes this quantitatively before the VLM sees it: `cutOffsetMs % 500 > 125` = beat misalignment flag, passed as text to the judge so it focuses on qualitative hold quality rather than trying to infer millisecond offsets from pixels.
4. **PALETTE DISCIPLINE** — maximum 2 hue families + 1 accent that appears exclusively on UI highlights or CTAs. Score 1 if more than 4 distinct hue families visible across the contact sheet.
5. **TRANSITION VARIETY** — at least 3 distinct types with no single type repeated more than 3 times in 30s.

Calibration: include URL-referenced reference contact sheets (a score-5 anchor, a score-2 anchor per dimension) as few-shot examples in the system prompt. This prevents score inflation after iteration 2 — the primary documented failure mode of self-refine loops. Prometheus-Vision showed 0.78 vs 0.62 Pearson correlation with/without reference examples.

**Effort: 2 days** for rubric, system prompt, and calibration anchor images.

---

### #6 — Beat Detection Stack: beat_this Offline + Essentia Confidence Gate + CV Snapping for AI Tracks

**What to install.** `pip install beat-this torch torchaudio essentia librosa ruptures`. Do not use madmom (broken on Python 3.10+ via PyPI, missing Python 3.10+ wheels) or aubio (abandoned February 2019, no modern wheel). Do not use BeatNet+ for offline batch (its downbeat F1 is 56% vs beat_this's ~75%).

**Pipeline.**
1. beat_this: `from beat_this.inference import File2Beats; beats, downbeats = File2Beats('final0', 'cpu')('track.mp3')`. Returns float-second arrays.
2. Essentia confidence gate: `bpm, beats_es, confidence, _, beat_intervals = es.RhythmExtractor2013(method='multifeature')(audio)`. Input MUST be 44100Hz (`MonoLoader(sampleRate=44100)`). If `confidence > 3.0`: use beat_this timestamps. If `1.5 < confidence < 3.0`: cross-check librosa BPM — if they agree within 2%, trust beat_this. If `confidence < 1.5`: flag track as unreliable.
3. AI track CV snapping: `CV = np.std(beat_intervals) / np.mean(beat_intervals)`. If `CV < 0.05` (pure AI track with metronomic tempo), discard the tracker entirely — compute exact grid: `all_beats = [downbeat_0 + n * (60/bpm) for n in range(num_beats)]`. If `0.05 < CV < 0.15`: snap each beat to nearest grid point.
4. Drop detection: `ruptures.Pelt(model='rbf').fit(tempogram).predict(pen=30)` for structural boundaries, filtered to after 30% of track, then ranked by compound score `onset_env[bp] * rms[bp]`. Do not use `np.argmax(onset_env)` — finds a snare hit, not the drop.
5. Downbeat usage rule: use `downbeats[]` only for major scene transitions. Use `beats[]` for SFX cues, camera pulses, typography entries. Downbeat F1 is 56–75%; using them for every visual event amplifies misses into visible artifacts. The compound-score crashFrame drives the beat 32 music crash, not the downbeat tracker.

Output JSON schema: `{ bpm, bpmConfidence, snappingApplied, cv, beats: [{sec, frame, beatNum}], downbeats: [{sec, frame, barNum}], crashFrame, energyCurve: [{frame, rms, onset}] }`. Store energyCurve at video fps (30 entries/sec = 900 for 30s), not at librosa's native 86fps — direct index lookup `energyCurve[frame]` in Remotion with zero math.

**Effort: 3.5 days** (1d beat_this + Essentia, 0.5d CV snapping, 1.5d drop detection + SFX cue classification, 0.5d JSON schema).

---

### #7 — CONTINUOUS_PAN + FEATURE_WALK Composition Rules Drive 71% of Top-Performing Videos

**CONTINUOUS_PAN.** 71% of analyzed top SaaS videos pan across an oversized canvas rather than cutting between features. Architecture: a wrapper div `position: absolute; width: 3840px` (2× composition width) with feature zones at x-positions 0, 1280, 2560. Camera pan = `translateX` spring on the wrapper: `{ stiffness: 80, damping: 20 }` (slow, cinematic, not snappy). Pan duration: 12–16 frames. Director JSON groups FEATURE_WALK scenes sharing a canvas with a matching `canvas_id` field. In Remotion, `overflow: 'hidden'` on the `AbsoluteFill` parent clips the oversized canvas.

**FEATURE_WALK composition rules.**
- Cursor: hyper-accelerated Bezier path (200–400ms traverse), absolutely positioned SVG circle with spring position interpolation.
- Click reward: full-viewport radial gradient (not just a click ring) at `accent_hex`, opacity 0.6→0 over 8 frames on click frame. This is the "dopamine click" — the full-width expansion is the single detail most implementations miss.
- Z-axis isolation: `filter: blur(6px) opacity(0.4)` on non-active siblings, fading in over 6 frames before cursor arrival.
- Cut acceleration: FEATURE_WALK sub-steps use `duration_beats` values of `[6, 5, 4, 3, 2]` — exponential acceleration approaching STAT_CALLOUT. Begin at 3s holds per interaction, end at 0.5s.

**Anti-UI hook rule.** 71% of top videos defer product UI past second 3. Any element with `data-ui="true"` must not render before frame 90 (second 3 at 30fps). Director LLM prompt: "Any scene with `ui_visible: true` must have `start_beat >= 6`." COLD_OPEN variants: TERMINAL_BOOT (Mac window + character-by-character output at ~60ms/char + 3D `rotateX(20deg)` spring entry), ABSTRACT_VOID (product-colored geometry scaling 0→1 over 4s), KINETIC_WORD_FLOAT (core pain noun crashing toward camera).

**Effort: 3 days** (CONTINUOUS_PAN canvas 1d, FEATURE_WALK cursor + ripple + blur 1.5d, hook enforcement 0.5d).

---

### #8 — @remotion/motion-blur Trail: Directional Smear That CSS blur() Cannot Replicate

**What it does.** Trail renders N clones of its children, each frozen to a past frame via Remotion's `Freeze` primitive. Layer opacity ramps from 0 (furthest back) to `trailOpacity` (current frame). The smear is directional because each copy is the actual past position — CSS `filter: blur()` spreads uniformly regardless of motion direction.

**Critical constraint.** `useCurrentFrame()` MUST be called inside a child component that is a descendant of Trail — not at the same level. Trail manipulates the time context; if the parent already resolved the spring before Trail can offset it, the blur does nothing.

**Verified prop values.** For word-slam text entry: `layers={12}` `lagInFrames={0.3}` `trailOpacity={0.8}`. Subtle text entry: `lagInFrames=0.1–0.2`. Aggressive comet tail: `lagInFrames=0.3–0.5`. Do not exceed `lagInFrames=1.0`. For `CameraMotionBlur` over a Playwright screenshot panel: `shutterAngle={180}` `samples={10}` (matches 1/60s film shutter). Drop `samples` to 8 for 15–20% faster render with imperceptible quality loss when GPU unavailable.

**Stack CameraMotionBlur + Trail:** `<CameraMotionBlur shutterAngle={240}><Trail layers={40} lagInFrames={0.2}><AnimatedElement /></Trail></CameraMotionBlur>`. Benchmark: adds 2–4s render time locally; Lambda cost +$0.002–0.003/render.

**Effort: 0.5 days.**

---

### #9 — Audio Licensing: Artlist $199/yr Is the Only Sub-$20/Month License That Covers Client Video Resale

**The hard commercial license facts.**
- Artlist Standard $199/yr ($16.58/mo): covers YouTube, commercial advertising, broadcast, film festivals. Resale safe.
- Epidemic Sound $20/mo: explicitly bans paid advertising and commercial productions. Unusable for client videos.
- Musicbed: $99.99/mo business tier required for commercial resale.
- Suno Pro: commercial use language present, but ToS states copyright vesting is NOT guaranteed. Adequate for demos; do not use for exclusive licensing or resale without disclosing this.
- Google Lyria 3 Pro: $0.08/track via API or $19.99/mo (10 tracks/day). Commercial rights confirmed by Google ToS. 400× cheaper than Suno Pro per track at API rate. Exposes BPM control in the generation prompt — if you request "120 BPM upbeat tech, 30s," that BPM is reliable and bypasses the beat tracker entirely for that track.

**Implementation.** For the automated tier: call Lyria 3 Pro API with `"120 BPM, [genre matching product category], 30s"`. Cache audio + BPM metadata in Supabase. For client deliverables: Artlist Standard subscription, tag catalog by BPM/mood/genre in a JSON index, director agent selects via the beat-proximity algorithm (find track whose detected BPM is within 2 of the target). Avoid Suno for any resale workflow.

**Effort: 2 days** (Artlist catalog indexing + Lyria API integration).

---

### #10 — remocn Registry: Source-Editable Components That the Director Agent Can Modify Directly

**Why this matters over npm packages.** `npx shadcn@latest add @remocn/[component]` drops editable `.tsx` source into `src/components/remocn/`. Spring configs, easing curves, and animation math are exposed and tweakable without forking a package — no version mismatch risk. The director agent LLM can be given these component files as context and instructed to patch spring configs as part of scene generation.

**Pipeline-relevant components.** `soft-blur-in` (blur-dissolve pattern), `per-character-rise` (overflow:hidden + per-char translateY), `zoom-through` (custom TransitionPresentation scale-through), `push-through`, `focus-pull`, `whip-pan` (camera-motion transitions), `grain-dissolve` / `ripple-zoom` (WebGL shader dissolves via HTML-in-canvas).

**Director agent integration.** Scene JSON uses `motionPreset: 'per-character-rise' | 'soft-blur-in' | 'wiper-reveal'` as a field. The scene executor switches on `motionPreset` to resolve the component. This is the two-tier vault architecture: 80% of scenes handled by vault components with no LLM animation code generation; 20% bespoke from the director agent for scenes requiring custom layout.

Also install `npx skills add remotion-dev/skills` — gives Claude the full Remotion API docs + design patterns including frame-offset calculations for music sync. This is what enables `framesPerBeat = fps * 60 / bpm` to be computed correctly inside generated code.

**Effort: 0.5 days** for remocn install + component wiring; 0.5 days for skills install + prompt tuning.

---

## PART 2 — 3-WEEK BUILD ORDER (Maximum Visible Quality Gain Per Day)

**Principle:** Build the beat-locked skeleton first (anything rendered on top of an arrhythmic timeline feels wrong regardless of visual quality), then add visual richness, then close the feedback loop.

---

### WEEK 1 — THE LOCKED SKELETON (Days 1–7)

**Day 1 — Beat analysis pipeline.** Python script `extract_beats.py` (args: audio_path, fps, output_path). Installs: `beat-this`, `essentia`, `librosa`, `ruptures`. Implements: beat_this offline, Essentia confidence gate, CV snapping for AI tracks, compound-score drop detection, SFX cue classification via spectral centroid (< 300Hz = kick, 300–4000Hz = snare, ≥ 4000Hz = crash). Outputs the full Remotion-ready JSON schema. Test with 3 Artlist tracks at different BPMs. Visible output: JSON file with beats, downbeats, crashFrame, energyCurve.

**Day 2 — Remotion composition skeleton.** 15-archetype Zod schema (TypeScript). `durationInFrames = scene.duration_beats * 15` enforced globally. `assertBeatAligned()` utility throwing in dev. Scene router component that switches on `scene_type` and renders a stub for each of the 15 types. `<Sequence from={scene.start_beat * 15} durationInFrames={...}>` wiring for all scenes. First render: 8 stub scenes, all gray boxes on beat grid — visually nothing, but the timing skeleton is verified.

**Day 3 — Typography vault (3 primitives).** Build as standalone vault components: (A) `<WiperReveal>` (clip-path wiper block, Pattern A), (B) `<LineReveal>` (overflow:hidden + translateY per word, Pattern B), (C) `<BlurCarousel>` (blur-dissolve word loop with hidden width anchor). Test all three with `npm run preview`. Add spring config constants file: `SPRING_EDITORIAL`, `SPRING_SNAPPY`, `SPRING_LOGO`, `SPRING_STANDARD`. Visible output: all three text animations rendering correctly in isolation.

**Day 4 — Director LLM first draft.** Remotion `llms.txt` in context. Crawl a target website (e.g., your own MotionLens) for copy, features, pain points. Vercel AI SDK `generateObject()` with Zod schema. Director prompt enforces: COLD_OPEN or PAIN_TYPOGRAPHY first, any `ui_visible: true` scene after beat 6, STAT_CALLOUT near beat 32, music_crash_beat field. First director-generated scene JSON validated and parsed.

**Day 5 — First end-to-end render.** Wire the canonical 8-scene sequence using real typography vault components for COLD_OPEN (KINETIC_WORD_FLOAT variant with `BlurCarousel`) and PAIN_TYPOGRAPHY (`WiperReveal`). Add placeholder gray boxes for PRODUCT_HERO through CTA. Add Artlist track audio at `volume: 0.12` with fade-in/fade-out via `Volume` component. Add `voiceover_delay_s: 0.65` logic for scenes with SLIDE_SPRING transitions. Render 30s MP4. Visible output: first watchable video — timing locked to music, text animated.

**Day 6 — Playwright screenshot integration.** Playwright capture pipeline: `emulateMedia({ colorScheme: 'dark' })`, screenshot at 1920×1080, crop to active area via sharp. Capture 3–5 product states (homepage, main feature, result state). Wire into PRODUCT_HERO scene: `<BrowserFrame url={...} screenshot={...}>` component with static chrome (traffic lights, URL bar, tab bar) + screenshot as `<Img>` child + `3D perspective` entry animation on scene start. Visible output: real product UI in video.

**Day 7 — STAT_CALLOUT + music crash.** Implement COUNTER_SLAM animation: `Math.floor(interpolate(frame, [0, 45], [0, finalValue], {extrapolateRight: 'clamp'}))`. Wire `crashFrame` from beat JSON to STAT_CALLOUT `start_beat`. Add bass_hit.wav SFX at `crashFrame` via `<Audio startFrom={crashFrame}>`. Add BEFORE_AFTER_ARROW variant: transformation arrow with spring stiffness:300. First full render with working stat callout synced to music crash.

---

### WEEK 2 — SCENE RICHNESS (Days 8–14)

**Day 8 — FEATURE_WALK: cursor + ripple.** SVG cursor circle with spring interpolation between waypoints. On click frame: full-viewport radial gradient `accent_hex → transparent`, opacity 0.6→0 over 8 frames. Exponential `duration_beats` schedule `[6, 5, 4, 3, 2]` in director JSON for FEATURE_WALK sub-steps. SFX: `ui_clack.wav` timed to each click frame via `<Audio startFrom={clickFrame}>`. Visible output: first FEATURE_WALK scene that feels interactive.

**Day 9 — Z-axis isolation + CONTINUOUS_PAN canvas.** Add `filter: blur(6px) opacity(0.4)` to non-active FEATURE_WALK siblings. Build infinite canvas wrapper: 3840px wide, feature zones at x-offsets 0, 1280, 2560. Camera pan spring `{ stiffness: 80, damping: 20 }`. Director JSON `canvas_id` field groups scenes sharing a canvas. Visible output: seamless pan between feature states with depth-of-field-like isolation.

**Day 10 — @remotion/motion-blur Trail.** Install `@remotion/motion-blur`. Extract `AnimatedWord` into its own component (Trail requirement). Add `<Trail layers={12} lagInFrames={0.3}>` to PAIN_TYPOGRAPHY word slam entries. Add `<CameraMotionBlur shutterAngle={180} samples={10}>` wrapping PRODUCT_HERO Playwright screenshot panels during entry. A/B preview Trail with/without to tune `lagInFrames`. Visible output: directional motion blur on fast text slams.

**Day 11 — BROWSER_CHOREOGRAPHY persistent container.** Static browser chrome component (macOS window: traffic lights + URL bar + tab bar). Content area: array of Playwright screenshots crossfading via `<Img>` + `interpolate` opacity. URL bar: character-by-character typewriter using `Math.floor(frame / 2)` char slice. Entry animation: 3D `perspective + rotateX(10deg)` spring entry. Visible output: browser frame persistent, content morphing inside.

**Day 12 — BENTO_EXTRACTION + WORKFLOW_CASCADE.** BENTO_EXTRACTION: 2–4 Playwright screenshots cropped (imagemagick `convert -crop WxH+X+Y`), positioned asymmetrically (dominant card 60% width, 2 flanking), spring entry from different off-screen edges staggered 80ms, large drop-shadow `0 40px 120px rgba(0,0,0,0.5)`. WORKFLOW_CASCADE CARD_STACK: step cards fly in staggered at 7 frames each, fan out, then `scale(0) opacity(0)` all simultaneously over 6 frames. "Done" indicator springs in at frame center after collapse. Visible output: two new scene types.

**Day 13 — remocn integration + component vault finalization.** `npx shadcn@latest add @remocn/zoom-through @remocn/push-through @remocn/per-character-rise`. Wire `motionPreset` field in scene executor. Add custom `zoomThrough()` TransitionPresentation: exit `scale(1→1.8) opacity(1→0)`, enter `scale(0.6→1) opacity(0→1)`, `springTiming({ config: { damping: 200 }, durationInFrames: 25, durationRestThreshold: 0.001 })`. Add `none()` presentation match-cut pattern for shared logo elements between scenes. Visible output: 3+ distinct transition types in a single render.

**Day 14 — CTA_COMPRESSION + CTA_AMBIENT_LOOP.** CTA_COMPRESSION: all visible UI elements `scale → center point` over 30 frames, fade, then CTA button springs in `{ stiffness: 200, damping: 20 }`. Ambient loop: pulsing glow `opacity: 0.6→0.9→0.6` at 0.4s period, 2–3 orbiting dots rotating at 0.25 rev/s, music fade-out over last 4 beats via `Volume` curve, resolve chime at CTA_COMPRESSION beat 1. Render a full 30s video — this is your first complete pipeline output.

---

### WEEK 3 — VLM CRITIQUE LOOP + AUDIO SYSTEM (Days 15–21)

**Day 15 — SFX synthesis pipeline.** Spectral centroid classification in the beat extractor (kick/snare/crash per onset). Whoosh cue added 1 beat before each downbeat. ffmpeg `filter_complex` to layer SFX WAV files at sfxCue frame positions: `[0]amix=inputs=N` with individual `adelay` per cue. Normalized to –12dB to prevent clipping. Visible output: video with rhythmically classified SFX rather than uniform clacks.

**Day 16 — Lyria 3 Pro integration.** Vertex AI API call: generate 30s track at explicit 120 BPM with genre prompt derived from product category (director agent picks from a 10-genre taxonomy). Cache audio + BPM metadata. Skip the beat tracker when Lyria BPM is available (CV will be < 0.01). Artlist catalog JSON index with BPM tags for human-selected tracks. Director agent selects between Lyria (speed) and Artlist (curation) based on a `music_source: 'ai' | 'licensed'` field in meta. Visible output: two audio pathways working.

**Day 17 — Contact sheet extractor.** `renderStill()` API calls for: frame 0, frame N-1, frame[cut-2] and frame[cut+2] per scene boundary, frames at beats 4, 8, 12, 16, 20, 24, 28 (every 2s). `Promise.all()` parallelization. File naming: `frame_NNNN_tMMMms_LABEL.png`. Preflight checker: compute `cutOffsetMs % 500` for each cut, minimum hold duration (≥ 8 frames = 267ms) per scene, palette hue count via `sharp` dominant color extraction. Preflight report formatted as text block prepended to judge prompt. Visible output: 27-PNG contact sheet + text preflight report.

**Day 18 — Gemini judge wiring.** Gemini 2.5 Flash API: system prompt with 5-dimension rubric, calibration anchor images (score-5 and score-2 for each dimension) as URL-referenced images, preflight report, labeled contact sheet. Output parsed via `JSON.parse(response.match(/```json\n([\s\S]+?)```/)[1])`. Gemini 2.5 Pro call for final gate on iteration 3. Iteration version history `{scene_json, scores, iteration}[]`. Accept/CONTINUE/BACKTRACK/RESTART decision logic. Visible output: first automated critique with per-dimension scores and frame citations.

**Day 19 — Revision instruction pipeline.** `mapFrameToSceneId(filename, sceneJson)` parsing timestamp from filename. Typed revision instruction schema with `property_path`, `target_scene_ids`, `suggested_direction`, `revision_priority`. Maximum 3 instructions per iteration (highest-priority failing dimensions only). `deepMerge(currentSceneJson, buildPatch(instructions))` using lodash `set()`. Director agent receives: original JSON + critique JSON + top-3 instructions, prompted to apply targeted patches only. Visible output: first full iteration loop (render → judge → patch → re-render).

**Day 20 — Calibration anchors + score drift prevention.** Render 3 reference videos using your now-complete vault: a high-quality output (score-5 anchors), a medium output (score-3 anchors), a mediocre output (score-1 anchors). Host contact sheets as static R2 URLs. Add to judge system prompt as few-shot calibration examples. Validate that scores on iteration-2 renders don't inflate above iteration-1 when the video hasn't meaningfully changed. Visible output: stable calibrated scoring.

**Day 21 — Full pipeline integration test.** Run 3 target SaaS websites end-to-end: crawl → director JSON → beat analysis → Remotion render → contact sheet → judge → iterate × 3 → final export. Measure: total cost per video, total wall-clock time, acceptance rate without human intervention, common RESTART triggers. Document the specific revision instruction types that recur most — these are vault gaps to fill next.

---

## PART 3 — HONEST UNSOLVED PROBLEMS AND RISKS

**1. Downbeat accuracy is structurally limited at 56–75% F1 on GTZAN.**
The best library (beat_this) misplaces roughly 1 in 4 bar boundaries. This is not a bug to fix — it's a measurement accuracy ceiling. The mitigation (use downbeats only for major scene changes, beats for SFX and micro-animation) reduces but does not eliminate the risk. You will occasionally get a major scene cut 250–500ms off the music bar. There is no drop-in fix; the only robust solution is manual downbeat correction for high-priority client videos.

**2. VLM aesthetic judgment hits a 72.52% ceiling on binary aesthetic classification (GPT-5 on the graphic design benchmark).**
The VLM judge cannot replace human QA for subjective dimensions. It reliably detects structural issues (hold duration, palette count, text size measurable from pixel data) but consistently underperforms on "does this feel premium" judgments. Implement it as a triage tool that catches the bottom 30% of outputs, not as a complete quality gate. Budget for human review on client-facing outputs until you've collected enough accepted/rejected pairs to calibrate the rubric further.

**3. GLSL shader transitions (makeHtmlInCanvasPresentation) require `chrome://flags/#canvas-draw-element` in headless Chromium.**
This flag is not reliably settable in Lambda environments. The `zoomBlur()` and `dreamyZoom()` built-in shader presentations and the gl-transitions.com shader library are currently unreliable in automated render pipelines. Use CSS-based custom TransitionPresentation (the `zoomThrough` pattern) instead of WebGL shaders unless you have confirmed GPU Lambda access with flag support. Test this explicitly in your Lambda setup before committing to GLSL.

**4. Lyria 3 Pro requires GCP Vertex AI setup, not a simple REST key.**
The API is routed through Vertex AI, which requires a GCP project, service account credentials, and billing enablement. The `$0.08/track` pricing is accurate but the onboarding overhead is 1–2 days of GCP configuration, not a 30-minute npm install. If you need audio in week 1, start with Artlist and add Lyria in week 3.

**5. Specificity density bottleneck is a data problem, not a pipeline problem.**
If the crawled website has no concrete metrics ("we help teams move faster"), the SPECIFICITY_DENSITY score will be ≤ 2 on every iteration, triggering infinite RESTARTs. The pipeline has no way to invent specific numbers. You need a pre-crawl specificity audit: if the website yields zero numeric claims, zero named integrations, and zero before/after comparisons, flag it for human enrichment before running the director agent. Expect this to affect 20–30% of early-stage SaaS products.

**6. Score calibration anchors don't exist until you have output.**
You cannot build calibration anchor contact sheets until the pipeline produces videos. This means the first 10–15 videos are calibrated on theory rather than real reference output, and the rubric will be miscalibrated in ways you cannot detect until you've accumulated enough human-reviewed pairs. Plan to recalibrate the anchor images and the scoring prompt after every 20 completed videos for the first 100.

**7. Playwright GPU screenshot in Lambda requires explicit `channel: 'chrome'` and is not standard.**
Headless Chrome's SwiftShader software renderer cannot draw Remotion's WebGL animations or complex CSS transforms correctly. You need `channel: 'chrome'` (real Chrome, not Chromium) in Playwright options for contact sheet extraction. This works reliably on your local machine with Chrome installed but requires a custom Lambda layer or a separate EC2 instance for remote rendering. Do not assume `renderStill()` via Lambda will produce identical frame output to your local preview without explicitly validating this.

**8. Suno's copyright risk is real but unresolved by courts.**
One production company's anecdotal "380K views, zero ContentID claims in 4 months" is not legal protection. The US Copyright Office's position (human authorship required) means AI-generated tracks cannot currently receive copyright protection in the US. For client videos with exclusivity requirements, use Artlist or Lyria (Google ToS confirms commercial rights). Document your music source at generation time regardless of which tool you use.