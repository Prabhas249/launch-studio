# Strategy — synthesized from 15-agent research + external (ChatGPT) review

## The three ideas the company is built on (both judges agree)
1. **Scene Grammar** — the LLM is a DIRECTOR emitting validated JSON, never an animator. Renderer executes.
2. **VLM Critique Loop** — generate → judge (5-dim rubric) → targeted patch → re-render. Max 3 iterations, BACKTRACK/RESTART logic. Almost nobody does this; it's how real designers work.
3. **Specificity Engine** — the veto dimension. "Powered by AI" scores 1 and restarts the pipeline. Real numbers, named integrations, real posts. Includes the **pre-crawl audit**: if a site yields zero numeric claims / named integrations, tell the founder BEFORE generating ("your site doesn't contain enough to make a great video — add X, Y") — that message is itself a product moment.

## External review corrections (accepted)
- **Story before motion.** Reordered build: Brain (director/story/specificity) → Body (motion/typography/beat) → Eyes (critique loop). Story decides if it spreads; motion decides if it embarrasses. Floor on motion, ceiling on story.
- **6 perfect archetypes, not 15.** v1 ships: COLD_OPEN, PAIN_TYPOGRAPHY, PRODUCT_HERO, FEATURE_WALK, STAT_CALLOUT, CTA_COMPRESSION. The other 9 stay in the Zod schema as stubs (cheap to keep, spec'd by research).
- **Performance Vault (GPT's addition, adopted):** store every generated video + its X/PH performance (views, replies, watch signals). Over time the director learns what converts, not just what looks good — outcome-based moat, uncopyable without volume. v0 = manual tagging of posted videos; v1 = API ingestion. Cold-start honesty: needs ~50+ posted videos before signal.

## Craft layer (important, not strategy): beat grid (15f/beat, assertBeatAligned), 3 typography primitives w/ spring presets, Trail motion blur, CONTINUOUS_PAN (71% of top videos), dopamine click, Artlist $199/yr (only cheap resale-safe license) / Lyria $0.08/track (Vertex setup 1-2d), beat_this+Essentia (NOT madmom/aubio — dead).

## Revised 3-week order
- **Week 1 — BRAIN:** crawl + specificity audit/miner → director agent + 6-archetype grammar → script quality iterated on 5 real sites (judge scripts as text before any rendering — cheap).
- **Week 2 — BODY:** typography vault, beat pipeline, transitions, FEATURE_WALK + pan, arranged sound.
- **Week 3 — EYES:** contact-sheet extractor, Gemini judge + calibration anchors, revision patches, performance vault v0.

## Honest risk register (from research Part 3)
Downbeat detection ~75% ceiling · VLM judge ~72% on "feels premium" (triage, not gate) · 20-30% of early SaaS sites lack specificity (pre-crawl audit mandatory) · GLSL transitions unreliable headless (use CSS zoomThrough) · Lyria needs GCP Vertex setup · calibration anchors need 20+ real videos.

## Full detail: PLAYBOOK.md (10 secrets + day-by-day) · FINDINGS_TOP30.md (ranked raw findings)
