# THE SOURCING + BUILD PLAN

---

## 1. VAULT EXPANSION — TOP-20 SHOPPING LIST

Ordered by impact-per-hour (impact level / effort in days). "Install" means npm unless noted. All MIT licensed unless stated.

**Tier 1: Zero-dep or one-line fixes — install and drop in today**

1. **overflow:hidden line-mask word reveal** — no new deps. In HookScene, PainScene, CTAScene: wrap each animated word span in `<div style={{overflow:'hidden', lineHeight:'1.1em', height:'1.1em'}}>`, inner `<span style={{display:'block', transform:\`translateY(${(1-progress)*100}%)\`}}>`. Uses `SPRING_STANDARD` already in `vault/springs.ts`. Converts opacity fades into AE-style baseline reveals. 0.5 days.

2. **@remotion/animation-utils** (`npm install @remotion/animation-utils`, v4.0.485, already in repo as transitive dep). Fixes a live bug: `makeTransform([translateY(y), rotateX(tilt), scale(s)])` enforces correct CSS transform order in RevealScene lines 107-110 — current template literal silently applies transforms right-to-left causing wrong pivot. 0.25 days. URL: remotion.dev/docs/animation-utils/make-transform

3. **@remotion/motion-blur** (`npm install @remotion/motion-blur`, v4.0.485, Remotion team, MIT). `<Trail layers={12} lagInFrames={0.3}>` on HookScene word entrances. `<CameraMotionBlur shutterAngle={180} samples={10}>` on RevealScene window entry. One rule: `useCurrentFrame()` must be inside the Trail child, not the parent. 0.5 days. URL: remotion.dev/docs/motion-blur/trail

4. **Variable font wght-axis animation** — no new deps. BricolageGrotesque already loaded via `@remotion/google-fonts`. In HookScene accent words: `fontWeight:'normal', fontVariationSettings:\`'wght' ${wght}\`` where `wght = interpolate(frame, [delay, delay+20], [300, 800], {easing:EASE_OUT_EXPO})`. Critical: set `fontWeight:'normal'` (not 800) when using fontVariationSettings or browser clamps to nearest named weight. 0.5 days.

5. **SFX library restructure** — no new deps. Move existing files into `public/audio/sfx/transition/`, `sfx/impact/`, `sfx/ui/`, `sfx/rise/`, `music/beds/`, `music/stems/`. Add 4 new synthesized SFX to `gen-sfx.sh`: ui/strike (anoisesrc + highpass 5kHz), ui/click (sine 1kHz), transition/swipe (pink noise + bandpass 1200Hz), rise/pulse_ring (sine 42Hz + long fade). Add SFX registry map in AudioTrack.tsx. 0.5 days.

**Tier 2: One-install, high payoff**

6. **@remotion/paths evolvePath** — already in package.json as `@remotion/paths: '^4.0.0'`, never imported. Replace PainScene accent div (lines 84-93) with SVG path using `evolvePath(strike, parsedPath)` — stroke-linecap:'round' strikethrough with slight downward arc. Also use `makeArc` from the same package for STAT_CALLOUT 'arc' variant (circular progress ring at r:300, fills clockwise in sync with odometer). Guard: if progress >= 0.999, render `<circle>` not `<path>` (makeArc with startAngle==endAngle = empty path). 1 day. URL: remotion.dev/docs/paths/evolve-path

7. **Wiper block clip-path reveal** — no new deps. New COLD_OPEN variant 'wipe': per line, `<div style={{position:'relative'}}><h2 style={{clipPath:\`inset(0 ${100-clipX}% 0 0)\`}}>` plus an absolutely-positioned solid div at `width:\`${blockX}%\`, backgroundColor:brand.colors.bg` that sweeps across then exits past 100% (overshoot to 110%). Spring: `SPRING_EDITORIAL` from vault/springs.ts. Stagger: 15 + i*20 frames. 1 day.

8. **Full-width click ripple + hyper-cursor** — no new deps. In FEATURE_WALK FeatureStep: add `AbsoluteFill` ripple layer at `radial-gradient(circle at 50% 62%, ${accent}40 0%, transparent 65%)` at opacity 0.6→0 over 8 frames, firing at `clickAt = stepStart + Math.round(stepDuration * 0.55)`. SVG cursor (r:11, fill:accent) springs between waypoints using `SPRING_SNAPPY {stiffness:250, damping:11, mass:0.5}` — already in vault/springs.ts. 1 day.

9. **remocn shadcn registry** — `npx shadcn@latest add @remocn/rgb-glitch-text @remocn/slot-machine-roll @remocn/blur-reveal`. Components install as editable TSX into /src/remotion/vault/. Replace default spring configs with vault/springs.ts imports. Lock glitch bursts to beat frames (not random). Match Slot Machine roll settle to existing pop.wav cue at countFrames. Add variant:'glitch' to ColdOpen, variant:'slot' to StatCallout in schema.ts. github.com/Remocn/remocn, 892 stars, MIT, last commit July 7 2026. 1 day.

10. **@curvable/motion** (`npm install @curvable/motion remotion react`; peer deps: ogl, @remotion/google-fonts). 14 components, pass one `primary` hex → all shades auto-derived. Target: Typewriter (COLD_OPEN base), StatsGrid (STAT_CALLOUT base). Deterministic on frame (no useState tricks). github.com/Curvable/motion, MIT. 1 day. URL: curvable.ai/library

11. **@remotion/lottie + lottie-web** (`npm install @remotion/lottie lottie-web`). Source CC0 animations from lottiefiles.com/featured (filter Free license). Immediate uses: animated checkmark chip in RevealScene (replaces static text); sparkle burst on CTA beat. Gotcha: fetch JSON via `fetchAnimationData(url)` inside delayRender/continueRender, or `import` static JSON directly — control frame via `frame={Math.floor(progress * lottieFrames)}` not real-time playback. 1 day. URL: remotion.dev/docs/lottie/lottie

12. **CONTINUOUS_PAN FeatureWalk variant** — no new deps. New schema variant:'pan'. 3840px-wide absolute wrapper, `transform:\`translateX(${panX}px)\``, three screenshot panels at x:0, x:1280, x:2560. Camera uses `SPRING_CAMERA {stiffness:80, damping:20}` already in vault/springs.ts. Title sidebar stays fixed in viewport. Hide cursor during pan (opacity:0 while `Math.abs(current-target) > 5`). 1.5 days.

**Tier 3: New scene archetypes**

13. **Onda registry** — `npx ondajs add fade-in typewriter code-block terminal mesh-gradient` (or bulk-add). 70 components + 18 transitions. Source-owned model: install drops editable TSX. Edit spring values to match vault/springs.ts. Requires Clash Display + Space Grotesk fonts (one-time). Start with: typewriter, code-block, terminal, mesh-gradient, transitions. github.com/degueba/onda, MIT. 2 days. URL: remotion.onda.video

14. **Deterministic particle confetti** (`npm install seedrandom`). `const rng = seedrandom('scene-' + frame)`. Pure function per frame: `x = centerX + Math.cos(rng() * Math.PI * 2 + frame/20) * (100 + i*2)`. No canvas-confetti (non-deterministic, fails Lambda). 0.75 days.

**Tier 4: 3D stack (sequential prerequisite chain)**

15. **@remotion/three + @react-three/fiber + three** (`npm install @remotion/three @react-three/fiber three`). Versions: @remotion/three v4.0.485, r3f v9.6.1, three v0.185.1. Use `<ThreeCanvas>` not raw Canvas — it feeds frame/fps into Three.js clock, making 3D deterministic for Lambda. `alpha:true` on gl context composites over 2D background. Gate for items 16-20. 2 days. URL: remotion.dev/docs/three

16. **maath easing.damp3** (`npm install maath`, v0.10.8, pmndrs, MIT). `easing.damp3(current, target, lambda:4, clampedDelta)` for camera orbits — asymptotic approach, never overshoots. Replace sine-wave sway in ProductHeroPhone. Clamp delta: `Math.min(delta, 1/30)`. Must run inside useFrame with target computed from useCurrentFrame() via ref. 0.5 days.

17. **@react-three/drei** (`npm install @react-three/drei`, v10.7.7, pmndrs, MIT). `useGLTF('/models/iphone16pro.glb')` for device models. `MeshTransmissionMaterial` (transmission:1, roughness:0.05, thickness:0.5) for glass — requires `<Environment>` in same scene graph or it renders black. Apply to body mesh only; apply `<meshStandardMaterial map={screenTex}/>` to screen face mesh. Access sub-meshes by name from nodes. 1 day.

18. **Device GLTF models** — download iPhone 16 Pro + MacBook Air M3 GLB from poly.pizza (CC0, free, no attribution). Draco-compress via `npx gltfpack --input model.glb --output model-compressed.glb --compression draco` (75% size reduction: 2.5MB → 625KB). Place at `/public/models/`. Replaces current CSS border-radius phone mockup with real PBR device. 1 day. URL: poly.pizza

19. **lamina shader layers** (`npm install @react-three/lamina`). `<Gradient position={[0,0,-20]} scale={5} colorA='#0a0a0c' colorB='#4d7cfe' speed={0.5}/>`. Renders in same WebGL pass as device — not a canvas-on-canvas double render like @shadergradient/react. Beat-sync: `speed={0.5 + beat_intensity * 0.3}`. 1 day.

20. **@react-three/postprocessing Bloom + ChromaticAberration** (`npm install @react-three/postprocessing postprocessing`). Bloom: `luminanceThreshold:0.3, intensity:1.5` — UI screen elements at luminance 0.7-0.9 glow automatically without special setup. ChromaticAberration: `offset=[interpolate(f,[cutFrame-2,cutFrame,cutFrame+4],[0,0.006,0]),0]` fires on beat boundaries. 1 day.

---

## 2. AUDIO SYSTEM

### Mixing Spec — Exact Numbers

**Master targets:**
- Integrated loudness: -14 LUFS (YouTube/Meta/TikTok normalized to -14, true peak -1 dBTP)
- VO track: normalize to -16 LUFS before placement (`ffmpeg -i in.wav -af loudnorm=I=-16:TP=-1 out.wav`)
- Post-render ffmpeg command: `ffmpeg -i rendered.mp4 -af loudnorm=I=-14:TP=-1:LRA=11 -ar 48000 -c:v copy output-normalized.mp4`

**Film.tsx bug to fix immediately:** Current `bedVolume` function comments say `0.22 ≈ -20dB` — this is wrong. `20*log10(0.22) = -13.2 dB`. Fix:
- Lyria/real track under VO: `volume=0.12` (-18.4 dB below VO)
- Synth bed under VO: `volume=0.15` (-16.5 dB below VO)
- Lyria no-VO sections: `volume=0.85`
- Synth no-VO sections: `volume=0.90`

**Linear gain to dB reference:** -15 dB = 0.178, -16 dB = 0.158, -18 dB = 0.126, -20 dB = 0.10

**VO-triggered ducking (not in Film.tsx currently — add this):**
- Attack: 3 frames (100ms at 30fps)
- Release: 9 frames (300ms at 30fps)
- Pattern: detect voRanges from `film.voFull` or `film.voTracks`, compute duckFactor per frame, blend BASE_DUCK and BASE_FULL

**SFX volume levels (relative to VO at 1.0):**
- impact/slam (window land, CTA): 0.65
- rise/crash + rise/boom (reveal hit): 0.55
- transition/whoosh: 0.40
- ui/enter (search ENTER): 0.70
- ui/pop (chip spring, card land): 0.30
- ui/click (cursor ripple): 0.45
- ui/strike (pain sweep): 0.40
- ui/keytick: 0.28-0.40
- ui/tick (stat counter): 0.18
- rise/pulse_ring (CTA rings): 0.20

**4 new SFX to synthesize (add to gen-sfx.sh):**
```
# ui/strike: short high-freq white noise burst
ffmpeg -f lavfi -i anoisesrc=d=0.06:c=white -af highpass=f=5000,afade=t=out:st=0.04:d=0.02,volume=1.2 sfx/ui/strike.wav

# ui/click: 1kHz sine click
ffmpeg -f lavfi -i sine=f=1000:d=0.04 -af afade=in:st=0:d=0.005,afade=out:st=0.03:d=0.01,volume=0.8 sfx/ui/click.wav

# transition/swipe: mid-freq pink noise swoosh
ffmpeg -f lavfi -i anoisesrc=d=0.25:c=pink -af bandpass=f=1200:w=800,afade=in:st=0:d=0.08,afade=out:st=0.08:d=0.17,volume=1.4 sfx/transition/swipe.wav

# rise/pulse_ring: sub-octave sine fade
ffmpeg -f lavfi -i sine=f=42:d=0.8 -af afade=out:st=0.05:d=0.75,volume=0.6 sfx/rise/pulse_ring.wav
```

**Folder structure (migrate now):**
```
public/audio/
  sfx/
    transition/   whoosh.wav, whoosh2.wav, swipe.wav (new)
    impact/       slam.wav, crash.wav, boom.wav
    ui/           keytick.wav, tick.wav, pop.wav, enter.wav, click.wav (new), strike.wav (new)
    rise/         riser.wav, pulse_ring.wav (new), crash.wav
  music/
    beds/         pulse/, heavy/, adrenaline/, lyria/
    stems/        kick.wav, hat.wav, stab2.wav
```

### Starter Library Shopping List

**Zero cost, zero attribution required:**
- Sonniss GDC bundle (sonniss.com/gameaudiogdc) — CC0, ~50,000 SFX covering all motion categories, game-grade quality, released annually. Download 2024 + 2023 for full coverage. This one download covers most SFX gaps.
- Pixabay Music (pixabay.com/music/) — Pixabay License, commercial OK. SergePavkinMusic uploads are BPM-labeled.
- Mixkit Music + SFX (mixkit.co) — Mixkit Free License, commercial, no registration required.

**Zero cost, attribution in description (not burned-in video):**
- Kevin MacLeod / Incompetech — CC BY 4.0. Target tracks: 'Investigations' (115 BPM dark corporate, COLD_OPEN terminal), 'Hackbeat' (120 BPM driving, FEATURE_WALK), 'Cipher' (tense, PAIN_TYPOGRAPHY), 'Digital Lemonade' (upbeat, CTA). URL: incompetech.com/music/royalty-free/music.html
- Freesound.org — Mix of CC0 and CC BY. Key contributors: InspectorJ (CC BY 4.0, UI and whoosh), LittleRobotSoundFactory (CC BY 4.0, futuristic UI pops), MATRIXXX_ (CC0, cinematic impacts), qubodup (CC0, whoosh sweeps). API access: freesound.org/apiv2/ (60 req/hr free tier).

**Paid — Artlist Standard $199/yr is the one subscription to rule them all:** Music + SFX bundled, commercial resale OK (client video delivery), YouTube + broadcast + ads covered. Breakeven: used in client videos, charge back as COGS. URL: artlist.io

**Do NOT use Epidemic Sound for client work** — explicitly bans paid advertising in ToS.

**Optional premium SFX:** BOOM CASUAL UI (~$495/yr or $1,500 perpetual buyout) — 125K+ motion-specific sounds in CLICK, PLOP, WIPE, WHOOSH, CARD, COIN categories. Only needed if Artlist SFX proves too thin.

**Music licensing risk flags:**
- Suno/Udio: avoid for client delivery — post-Warner 2026 commercial status unclear, ongoing class-actions
- Lyria 3: class-action pending but Google provides indemnification for covered services. Include disclaimer in client contract.
- ElevenLabs Music v2 (June 11 2026): licensed stems, cleared for YouTube/ads/apps, NOT streaming platforms (Spotify/Apple Music) — irrelevant for SaaS launch video pipeline

### Lyria 3 Prompt Library

Access: Consumer testing at aitestkitchen.withgoogle.com/tools/music-fx (no Vertex setup). Production API: Vertex AI (GCP project + service account + billing, 1-2 days setup). Cost: $0.08/track. Caching: SHA-256 hash prompt → filename, stored in runs/lyria-cache.json.

Six prompts mapped to FilmSchema.music enum:

**PULSE** (dark_terminal, COLD_OPEN/terminal): "120 BPM electronic. Four-on-the-floor kick drum, open hi-hat on offbeat 8th notes, 55 Hz sub bass drone pulsing on downbeats. Minimal arrangement, no melodic content. Sparse for first 4 bars, full percussion groove from bar 5. Dry, industrial, forward-momentum. Clean mix, no reverb on drums. 30 seconds."

**HEAVY** (PAIN_TYPOGRAPHY dark sequences): "80 BPM halftime groove. Kick drum on beats 1 and 3 only. Snare on beat 3. Warm sub bass at 40 Hz with slight tube saturation. No bright high-frequency content. Minor mode. Descending synth bassline, 4-note pattern repeating. Oppressive, cinematic, trap-influenced production. No melody. 30 seconds."

**ADRENALINE** (climactic FEATURE_WALK): "120 BPM driving electronic. Kick on every quarter note. 16th-note closed hi-hat pattern. Driving 8th-note synth bass stabs. Sparse bars 1-4: kick and bass only. Bars 5-8: add hats. Bars 9-16: full arrangement with syncopated snare fills. Euphoric, relentless, commercial-electronic production aesthetic. No breakdown. 30 seconds."

**EMOTIVE** (PRODUCT_HERO/bento + CTA warm resolution): "120 BPM. Opening 8 bars: sparse electric piano chords, Fender Rhodes voicing, one chord per bar. Bar 9: string ensemble enters with sustained whole notes in a major key. Bar 13: add light percussion: rim shot on beats 2 and 4. Hopeful, cinematic, emotionally warm. Resolves on a major chord sustained with reverb tail. Broadcast-quality mix. 30 seconds."

**TENSION** (PAIN_TYPOGRAPHY/strike_list, pre-reveal sequences): "Slow 70 BPM. No percussion. Low cello section playing long tones on a tritone interval. High violin harmonics entering every 4 bars, ascending by a half-step each time. Dissonant cluster chords held under the melody. Oppressive, cinematic thriller aesthetic. Builds in density from bar 1 to bar 16 without resolving. 30 seconds."

**WARM CTA** (editorial_cream stylePack): "120 BPM upbeat. Acoustic guitar strumming on beats 2 and 4. Bright upright piano playing chord inversions. Light tambourine on offbeats. Major key, cheerful. Optimistic, human, commercial music for lifestyle advertising. Not electronic — organic instruments throughout. Resolves with a full chord sustain and natural reverb decay at end. 30 seconds."

**Lyria production rules:**
- Always specify BPM explicitly — output has CV < 0.01 (metronomic), skip beat_this for Lyria tracks
- Always write "No melody" for bed tracks under VO — prevents melodic line fighting narration
- Always specify duration ("30 seconds") — model defaults to variable length otherwise
- Use structural bar directives ("bars 1-4: X, bars 9-16: Y") for consistent builds
- Never name artists, bands, songs — triggers copyright filter

---

## 3. THE VOICE VERDICT

**Default: Gemini TTS — keep as pipeline default**

Current setup is already correct. Quality reality check as of mid-2026 (Artificial Analysis Speech Arena):
- Gemini 3.1 Flash TTS ELO: ~1,215 (ranked #1 or #2)
- ElevenLabs v3 ELO: ~1,178 (ranked #3 or #4)
- Gap: ~37 ELO points = Gemini wins ~55% of blind A/B comparisons

The 2024 narrative that ElevenLabs is "the quality standard" is outdated. Keep Gemini default; add ElevenLabs as optional premium tier.

**Immediate action:** Test `gemini-3.5-flash-preview-tts` (launched June 2026) by adding it to the front of the MODELS array in voiceover-full.mjs. Same API shape as current. If quality matches, it costs $0.003/clip vs $0.011 for 3.1 Flash.

Cost per 55-word scene (~330 chars, ~22s audio, ~550 output tokens):
- Gemini 3.5 Flash TTS: $0.003/clip ($6/M tokens)
- Gemini 2.5 Flash TTS (current): $0.011/clip ($20/M tokens)
- ElevenLabs v3 API: $0.033/clip ($0.10/1K chars)
- ElevenLabs Flash API: $0.017/clip ($0.05/1K chars)

Full production run (6-scene, 3 candidates): Gemini $0.20, ElevenLabs v3 $0.60.

**ElevenLabs Premium Add-On — Exact IDs and Settings**

Recommended voices (premade, no cloning needed):
- **Brian** — `nPczCjzI2devNBz1zQrb` — deep, American, calm, steady. Best for dark_terminal films.
- **Daniel** — `onwK4e9ZLuTAKqWW03F9` — deep, British, news-presenter cadence. Signals documentary authority. Best for international/upmarket products.
- **Adam** — `pNInz6obpgDQGcFmaJgB` — deep, American, warmer than Brian. Fallback.

Do NOT use: Josh (too young), George (too raspy/distinctive), Bill (too assertive).

**API settings:**
```json
{
  "model_id": "eleven_v3",
  "voice_settings": {
    "stability": 0.72,
    "similarity_boost": 0.75,
    "style": 0.10,
    "speed": 0.95,
    "use_speaker_boost": true
  }
}
```

**Output format:** `?output_format=pcm_24000` — returns signed 16-bit little-endian PCM at 24kHz mono, binary stream (not base64). Your existing ffmpeg command works unchanged: `ffmpeg -f s16le -ar 24000 -ac 1 -i raw.pcm out.wav`. Replace `Buffer.from(b64, 'base64')` with `Buffer.from(await res.arrayBuffer())`.

**eleven_v3 audio tags for documentary scenes:**
- `[deliberate]` — measured pace
- `[understated]` — inverse of excited, for PRODUCT_HERO
- `[pause]` — hard beat at paragraph break
- `[breathes]` — grounding before a stat
- `[emphasized]` — punch a number

**ElevenLabs API cost (no subscription required):**
- eleven_v3: $0.10/1K chars
- Starter $5/mo (30K chars) unlocks commercial license if you prefer subscription
- Creator $22/mo (100K chars) covers ~286 sixty-second videos/month

**Pricing to clients:** Offer Gemini default; charge $10-20 extra per video for "voice selection" (ElevenLabs Brian/Daniel). The $0.60/run upcharge is covered many times over.

**Voices to skip:**
- Aaron (aZESZDku5UjDxqAXiNzJ) — energetic, not documentary/calm
- Cartesia Sonic 3 — latency optimization irrelevant for pre-rendered video

---

## 4. TIMELINE EDITOR

### Recommended Path

Build from scratch. Do NOT use:
- `react-video-editor@1.0.2` — requires React 17, hard incompatibility with React 19.2.3
- `@designcombo/timeline` — multi-track CapCut model incompatible with scene-array Film JSON; brings fabric 6 + lodash-es + immer as payload
- Remotion Studio internal timeline — not exported from any Remotion package

**Only dep to add:** `npm install @hello-pangea/dnd immer`
- @hello-pangea/dnd v18.0.1 — maintained fork of react-beautiful-dnd, peer deps `react: '^18.0.0 || ^19.0.0'`
- immer — immutable Film state updates via `produce()`

### Build Estimate: 3 Days, 7 Files, ~750 Lines

**Architecture principle:** `useState<Film>` in editor/page.tsx is the single source of truth. `inputProps={film}` passes it to Player. React state diffing rerenders only leaf components — no performance issue for a 400-byte JSON object.

**Day 1 (6h) — Player shell + timeline strip:**

`/src/app/editor/page.tsx` (~120 lines)
- State: `const [film, setFilm] = useState<Film>(sampleFilmJson)`
- Player wiring: `<Player ref={playerRef} component={GrammarFilm} inputProps={film} calculateMetadata={async ({props}) => ({durationInFrames: filmDuration(props)})} />`
- The `calculateMetadata` prop is required — without it, durationInFrames goes stale when scenes are added or reordered

`/src/components/timeline/TimelineStrip.tsx` (~80 lines)
- Render `film.scenes` as proportional-width blocks: `width = (sceneBars / totalBars) * containerWidth`
- `sceneBars = scene.durationBars ?? ARCHETYPE_BARS[scene.type]`
- Click-to-seek: `playerRef.current.seekTo(starts[i])`
- Color-code blocks by scene type

`/src/components/timeline/PlayheadMarker.tsx` (~25 lines)
- In editor/page.tsx useEffect: `ref.addEventListener('frameupdate', ({detail:{frame}}) => setCurrentFrame(frame))`
- Note: `useCurrentPlayerFrame()` does NOT exist in @remotion/player v4 — use the event listener pattern
- `left: \`${(currentFrame / totalDuration) * timelineWidth}px\``

**Day 2 (8h) — Drag reorder + inspector:**

`/src/components/timeline/SceneBlock.tsx` (~60 lines)
- Wrap in `<Draggable draggableId={\`scene-${i}\`} index={i}>`
- Apply `dragHandleProps` to grip icon at top of block only (not full block — clicks on block body pass through to seekTo)
- `<DragDropContext onDragEnd={handleReorder}>` at editor page level
- onDragEnd: splice + reinsert into `film.scenes` array, call `setFilm`

`/src/components/inspector/SceneInspector.tsx` (~50 lines)
- Switch on `scene.type`, render appropriate field component
- Global VO textarea appears for all types (editing `scene.vo`)
- 380px-wide right sidebar, position sticky, overflow-y auto
- `onChange = (updated) => setFilm(produce(film, draft => { draft.scenes[selectedIdx] = updated }))`

`/src/components/inspector/fields/` — 6 files (~80 lines each):
- `ColdOpenFields.tsx` — word-list editor (add/remove row, accent checkbox per word), variant select
- `PainTypographyFields.tsx` — lines textarea, variant select
- `ProductHeroFields.tsx` — screenshot path input, variant radio
- `FeatureWalkFields.tsx` — array of step editors (screenshot + title per step)
- `StatCalloutFields.tsx` — number input (with "REAL number from site" warning), context string, variant
- `CtaCompressionFields.tsx` — headline textarea, domain input, button label

Important: manual field components per type, NOT auto-gen from Zod. Arrays of objects (`words: [{t, accent}]`, `steps: [{screenshot, title}]`) need custom add/remove UI that Zod introspection cannot produce cleanly.

**Day 3 (5h) — Toolbar + Regen VO:**

`/src/components/editor/EditorToolbar.tsx` (~60 lines)
- Style pack dropdown, music enum dropdown
- Render button: POST to existing Lambda render API route

`/src/app/api/editor/regen-vo/route.ts`
- Accepts `{film: Film, sceneIndex: number}`
- Extract `scene.vo` text, call Gemini TTS API inline (extract TTS fetch from voiceover.mjs into `src/helpers/gemini-tts.ts`)
- Write WAV to `public/vo/{brand}-{sceneIndex}-{timestamp}.wav`
- Return `{path: '/vo/filename.wav'}`
- On success: `setFilm(produce(film, draft => { draft.voTracks[sceneIndex] = publicPath }))`

**Schema change required for timeline resize:**
In `schema.ts`, add `durationBars: z.number().int().min(1).max(12).optional()` to all 6 scene union members. Drag handle snaps to bar increments: `Math.round(draggedWidth / barWidthPx) * barWidthPx` — preserves beat-lock.

**Key gotcha:** Wire to `GrammarFilm` + `FilmSchema` (not LaunchVideo — the existing src/app/page.tsx uses the older schema).

---

## 5. VIDEO-FLOW NUMERIC RULES FOR DIRECTOR AGENT

**Beat grid constants (inject into system prompt as JSON):**
```json
{
  "bpm": 120,
  "fps": 30,
  "bar_frames": 60,
  "beat_frames": 15,
  "bar_seconds": 2.0,
  "beat_seconds": 0.5
}
```

**Scene duration targets (ARCHETYPE_BARS):**
- COLD_OPEN: 2 bars (120 frames, 4s)
- PAIN_TYPOGRAPHY: 2 bars
- PRODUCT_HERO: 3 bars (180 frames, 6s)
- FEATURE_WALK: 4 bars total; step durations must be array `[6, 5, 4, 3, 2]` beats (exponential decay — never uniform)
- STAT_CALLOUT: 2 bars
- CTA_COMPRESSION: 3 bars

**Cut timing distribution (70/20/10 rule):**
- 70% of scene boundaries: `frame % 15 == 0` (on-beat)
- 20%: `frame % 15 == 13 or 14` (1-2 frames pre-beat, creates anticipation)
- 10%: arbitrary frame (breaks pattern after 8-9s of predictability)
- Director must vary — 100% on-beat is flagged as "lazy editing"

**Energy curve rule:**
- Beats 0-32 (frames 0-480, first 16s): visual density < 0.4; holds ≥ 4 beats each; max 2 scene transitions
- Beat 32 (frame 480): music drop / STAT_CALLOUT peak; boldest visual moment (largest number slam, color shift)
- Beats 32-60 (frames 480-1800): density > 0.6; 2-beat alternation; FEATURE_WALK exponential cut acceleration

**Motion/hold ratio rule:**
- Max 60% motion frames per scene (motion = position/scale/opacity/rotation delta > 1px or 1%)
- Min 40% static hold frames
- Minimum hold duration: 8 consecutive frames (267ms) — below this reads as stutter, not hold

**Hook gate — first 3 seconds:**
- At least one frame with headline at ≥ 70% of frame height by frame 30
- If `cold_open_headline_max_size_pct < 70`: RESTART with instruction to increase font size
- 71% of viewer drop decisions made in frames 0-90

**Layout preference:**
- Default to CONTINUOUS_PAN for FEATURE_WALK (71% of top SaaS videos use it)
- `canvas_width_px: 3840` for pan layouts
- Feature zone x-offsets: 0, 1280, 2560 (3 zones × 1280px each)
- SPRING_CAMERA `{stiffness:80, damping:20}` for pan (slow/cinematic, not UI-snappy)
- Pan duration per step: 12-16 frames (0.4-0.53s)

**Beat detection rules:**
- Use `beats` for all SFX cues and micro-animations — never downbeats for rapid events
- Use `downbeats` only for major scene transitions, max 4 per video
- Downbeat F1 ceiling: 56-75% (1 in 4 bars will be misplaced by 250-500ms)
- Lyria tracks: CV < 0.01, skip beat_this, use exact grid: `beat_n_sec = n * (60/120) = n * 0.5`
- Artlist/human-recorded tracks: run full beat_this + Essentia pipeline; confidence gate: >3.0 = trust, 1.5-3.0 = cross-check librosa BPM, <1.5 = skip beat detection

**Beat frame lookup table rule:**
- Pre-compute `frameBeats.json`: `{frame: {beatNum, barNum, energyNormalized, beatPhase, isDownbeat}}`
- Store in film.json, reference via `frameBeats[frame]` — never accumulate state
- Determinism rule: no `delta`-based animation. Replace all `group.rotation.y += 0.01` patterns with `interpolate(frame, [startFrame, endFrame], [startVal, endVal])`

**SFX event mapping by archetype:**
- COLD_OPEN/terminal: char typed → ui/keytick (volume ramp 0.28-0.40); ENTER → ui/enter (0.70); exit → impact/boom (0.55)
- COLD_OPEN/search: same as terminal
- PAIN_TYPOGRAPHY/strike_list: each strike sweep → ui/strike (0.40); entrance → no SFX
- PRODUCT_HERO/window_slam: window lands at BAR → impact/slam (0.65); chip spring → ui/pop (0.30)
- PRODUCT_HERO/bento: each card (staggered 5 frames apart) → ui/pop (0.25, 0.28, 0.30)
- FEATURE_WALK: each step slide-in → transition/swipe (0.35); cursor click → ui/click (0.45)
- STAT_CALLOUT/odometer: each tick frame → ui/tick (0.18); count-lock → ui/pop (0.35)
- CTA_COMPRESSION: flood circle scale-in → rise/crash (0.55); each pulse ring → rise/pulse_ring (0.20)
- Inter-scene cuts: transition/whoosh alternating (0.40)

---

## PRIORITIZED 2-WEEK INTEGRATION ORDER

**Week 1: Visual polish + audio system fix (no new infrastructure)**

**Day 1 — Fix the mixing bug + restructure audio:**
- Fix Film.tsx bedVolume: 0.22 → 0.12 (Lyria) / 0.15 (synth), add VO-triggered ducking code
- Run SFX folder migration (move files to new taxonomy paths, update all staticFile() refs)
- Run 4 new SFX synthesis commands in gen-sfx.sh
- Verify with a render of the existing leadverse.ai film — audio should be noticeably cleaner

**Day 2 — Word reveal + transform bug fix:**
- overflow:hidden word reveal in HookScene, PainScene, CTAScene (0.5 days)
- @remotion/animation-utils makeTransform in RevealScene (0.25 days)
- Both are zero-dep, drop-in replacements — test in Remotion Studio immediately

**Day 3 — Motion blur + variable font:**
- `npm install @remotion/motion-blur`
- Trail on HookScene word entrances (extract AnimatedWord component first)
- CameraMotionBlur on RevealScene window entry
- Variable font wght-axis on BricolageGrotesque in HookScene + FeatureScene titles

**Day 4 — SVG paths + new scene variants:**
- @remotion/paths evolvePath for PainScene strikethrough
- makeArc for STAT_CALLOUT 'arc' variant
- Add variant:'arc' to StatCallout schema + scenes.tsx

**Day 5 — Editorial reveals + click reward:**
- Wiper block clip-path reveal (COLD_OPEN variant:'wipe', PAIN_TYPOGRAPHY variant:'print_press')
- Full-width click ripple + hyper-cursor in FEATURE_WALK FeatureStep

**Day 6 — Component registries:**
- `npx shadcn@latest add @remocn/rgb-glitch-text @remocn/slot-machine-roll @remocn/blur-reveal`
- Replace spring configs with vault imports in each, add beatFrame prop
- Add variant:'glitch' to ColdOpen, variant:'slot' to StatCallout in schema

**Day 7 — Voice A/B + CONTINUOUS_PAN:**
- Test `gemini-3.5-flash-preview-tts` in voiceover-full.mjs (add to MODELS array front)
- Add `ttsElevenLabs` function + VOICE_IDS map, run Brian candidate vs Charon on leadverse.ai
- CONTINUOUS_PAN variant for FEATURE_WALK (3840px canvas, SPRING_CAMERA)
- Add durationBars optional field to all 6 schema union members

**Week 2: Timeline editor + 3D stack**

**Day 8 — Timeline editor Day 1:**
- `/src/app/editor/page.tsx` (Player + Film state + calculateMetadata)
- `/src/components/timeline/TimelineStrip.tsx` (proportional blocks + click-to-seek)
- `/src/components/timeline/PlayheadMarker.tsx` (frameupdate event listener)

**Day 9 — Timeline editor Day 2:**
- `npm install @hello-pangea/dnd immer`
- `/src/components/timeline/SceneBlock.tsx` (drag wiring, grip handle only)
- `/src/components/inspector/SceneInspector.tsx` (type switch)
- All 6 field files in `/src/components/inspector/fields/`

**Day 10 — Timeline editor Day 3 + post-render normalization:**
- `/src/components/editor/EditorToolbar.tsx` (style pack, music, Render button)
- `/src/helpers/gemini-tts.ts` (extract TTS logic from voiceover.mjs)
- `/src/app/api/editor/regen-vo/route.ts` (per-scene VO regeneration)
- Add `normalize.mjs` script with ffmpeg loudnorm post-render command

**Day 11 — 3D foundation:**
- `npm install @remotion/three @react-three/fiber three maath`
- ThreeScene.tsx with ThreeCanvas shell (alpha:true, composites over 2D bg)
- Verify determinism: render frame 450 twice, binary compare PNGs
- maath easing.damp3 replacing sine-wave sway in ProductHeroPhone

**Day 12 — Device models + glass material:**
- `npm install @react-three/drei`
- Download iPhone 16 Pro GLB from poly.pizza, Draco-compress via gltfpack
- DeviceModel.tsx: useGLTF + MeshTransmissionMaterial on body + Environment preset:'city'
- Apply screenTexture to screen face mesh

**Day 13 — Bloom + gradient backgrounds:**
- `npm install @react-three/postprocessing postprocessing @react-three/lamina`
- Bloom (luminanceThreshold:0.3, intensity:1.5) in EffectComposer
- ChromaticAberration offset driven by cut-frame interpolate
- lamina Gradient background (colorA:'#0a0a0c', colorB:'#4d7cfe')

**Day 14 — Lottie + Lyria + director rules:**
- `npm install @remotion/lottie lottie-web`
- Download CC0 checkmark + sparkle from lottiefiles.com, add to RevealScene chips + CTA
- Set up aitestkitchen.withgoogle.com/tools/music-fx and iterate on PULSE + HEAVY prompt variants
- Inject all 5 numeric rules sections into director LLM system prompt as a JSON block
- Run full pipeline on 2 new domains to validate the integrated system

**Running total new deps after week 2:**
`@remotion/animation-utils @remotion/motion-blur @remotion/paths @remotion/shapes @remotion/three @remotion/lottie @react-three/fiber @react-three/drei @react-three/lamina @react-three/postprocessing three postprocessing maath @hello-pangea/dnd immer lottie-web seedrandom @curvable/motion`