# A/B result — TrustMRR: our Remotion pipeline vs HyperFrames method (Jul 8, 2026)

Two videos, SAME brain (our storyteller "Screenshot Economy" script + our Iapetus VO + our Lyria track), DIFFERENT engine + art-direction:
- `out/trustmrr-launch.mp4` — OURS (Remotion, dark_terminal style pack, our scene vault)
- `out/trustmrr-HYPERFRAMES.mp4` — THEIRS (HyperFrames, blue-professional preset, 6 frame-worker-authored HTML compositions, Vercel-sandbox-class render)

## How the HyperFrames build went (faithful to their /product-launch-video method)
- `hyperframes init` → their `capture` (9 shots, 83 assets, tokens, fonts — richer than our crawler) → `build-frame.mjs` preset (blue-professional) → STORYBOARD/SCRIPT → 6 parallel frame-worker agents authoring self-contained `<template>` GSAP compositions → assemble-index → lint/validate → render.
- Render: **28.5s @ 1920×1080 in 27s** with 3 parallel workers (our Remotion single-thread is slower).
- Their tooling caught real issues: auto-repaired 4 frames' missing dimensions, flagged `../../assets` path bug (their resolver is root-relative), required audio `id`s, WCAG contrast warnings. Solid guardrails.
- I hit + fixed the same accent-contrast bug we solved in our pipeline: their `build-frame` colorStats picked a washed-out cream from TrustMRR's monochrome brand; restored the preset's cobalt by hand.

## Honest verdict
- **Raw output quality: roughly a WASH.** The HyperFrames cut is clean, coherent, editorial-premium (monospace Inconsolata + cobalt + light canvas fits a finance/verification product). Ours (dark terminal) is punchier. Neither obviously crushes the other — because the quality that matters (script, story, audio) is OURS and ported over unchanged.
- **Platform completeness: HyperFrames wins decisively.** It handed us, for free: a cohesive preset design system, richer capture, a browser Studio timeline editor, parallel + Vercel-sandbox cloud render, lint/validate tooling, and Apache-2.0 (no license ceiling). These are exactly Phase B/C items on our roadmap.
- **The moat is confirmed engine-agnostic:** I reused `runs/trustmrr.com/story.json` + our VO + our Lyria track verbatim. The storyteller/specificity brain is the product; the engine is a swappable substrate.

## Implication for the engine decision (INTEGRATION_PLAN.md)
This is NOT "their output is so much better we must switch." It's "their PLATFORM is more complete, our brain ports cleanly onto it, and it's Apache-2.0." → Strong case to build the **hosted product** on HyperFrames (inherit render infra + editor + presets), keep 100% of our storyteller/taste/distribution moat, and treat our Remotion pipeline as the reference/fallback. Decide rested; this render is the evidence.

## Scratch project
`~/dev/hf-scratch/trustmrr-hf/` (Node 22). Reference clones of all HeyGen repos in `~/dev/hf-scratch/`.
