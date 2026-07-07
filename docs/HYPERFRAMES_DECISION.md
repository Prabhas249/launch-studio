# HyperFrames — strategic assessment (Jul 7-8, 2026)

## What it is
HeyGen's open-source video framework. HTML/CSS/JS → deterministic MP4 (headless Chrome + FFmpeg — same core as Remotion). **33.6k stars, 278 releases, ~54 contributors, releases every few hours, `@claude` is a listed contributor.** Ships 20 agent skills incl. `/product-launch-video` (from a URL) and `/website-to-video` — i.e. OUR product, free. Packages: core/engine/producer/**studio (browser timeline editor)**/player/shader-transitions/**aws-lambda (cloud render)**.

## License (the question that was asked — verified)
- **Framework (`heygen-com/hyperframes`): Apache 2.0** (changed from MIT in PR #183). README: *"no per-render fees or commercial-use thresholds."* → **We CAN legally fork it, build a commercial product on it, keep our additions closed.** Must keep copyright notices; cannot use the HyperFrames/HeyGen name to market.
- **Launch examples (`hyperframes-launches`): NO license file (404).** → read/learn only. Cannot copy its code or (LFS) assets into our product. Techniques/methodology are not copyrightable — learning from them is fine.
- **Remotion (our current engine): source-available** — free for solo/small, **paid company license above a threshold.** HyperFrames Apache-2.0 has no such threshold. Not urgent solo, but real.

## The hard truth
HeyGen didn't just commoditize the engine — `/product-launch-video from a URL` nearly commoditizes the developer-facing product. **The question that decides if this idea lives: what do we sell that `npx skills add heygen-com/hyperframes` doesn't give away free?**

## The moat that survives (engine-agnostic — ports to either stack)
1. **Storyteller + specificity engine** — non-slop, villain-framed, numbers-only script from a URL. HyperFrames has no narrative brain.
2. **Curated launch-video taste** — opinionated Skale-grade aesthetic, not a generic block catalog.
3. **Hosted, no-code, paste-URL product for NON-developers** — HyperFrames needs Node/FFmpeg/terminal/coding-agent. 99% of founders won't. HeyGen (enterprise avatars) won't build the indie button. **This is the opportunity.**
4. **Critique loop + performance vault + distribution/build-in-public.**

## The strategic fork (decide RESTED, on evidence)
- **Option A — keep Remotion stack.** Works today, momentum intact, harvest HyperFrames methodology into our brain. Moat unaffected.
- **Option B — re-platform render layer onto HyperFrames (Apache 2.0).** Inherit their Lambda render + Studio timeline editor + adapter ecosystem for free; HTML is more agent-native than React. Cost: 1-2 weeks rebuild of the render components only.
- **Nothing from today is wasted either way:** crawler, storyteller, specificity engine, scene grammar, audio system, vault DESIGNS, all research — port over. Only Remotion-specific render code would be rewritten as HTML.
- **The decider:** run their `/product-launch-video` on leadverse.ai, compare to our v8. Theirs crushes ours → port the brain onto their engine. Ours holds (tuned vault/storyteller) → keep Remotion, mine them for parts.

## Methodology harvested from their SCRIPT.md / STORYBOARD.md (apply NOW, regardless of engine)
- **Word-count→duration math:** ~110 spoken words ≈ 50-55s at "Apple-keynote cadence"; plan silent visual gaps INTO the VO (they reserve ~3s montage + an A-roll beat). We already budget words — add planned silent beats.
- **VO direction as a CHARACTER, not adjectives:** *"Mid-age male, calm confident, Apple keynote presenter — Craig Federighi energy without the jokes. Silence between sentences is a feature."* Exactly validates our situational-direction TTS fix. Steal the "silence is a feature" framing.
- **Underscore direction with real references + section mapping:** *"warm sustained pad already playing at t=0 (no silence-to-sound), swells during flex 0:24-0:38, drops for the comparison beat, resolves on a final chord. Tycho / softer Jon Hopkins. NOT trailer music, NOT corporate stock."* → upgrade our Lyria prompts to name a build/drop/resolve arc + reference vibe.
- **Palette NOT prescribed — agent picks per beat from its own style system** (matches our director + style-pack architecture). Their guardrails: **no dark-mode-default (light/warm home base), push color presence (muted ok, flat not), distinctive typography PER BEAT (no single font family), err toward MORE motion ("subtle reads as static at 30fps").** ← our films over-use one font + lean dark; fix both.
- **Production artifacts per project:** SCRIPT.md (versioned, with change log + reasons) + STORYBOARD.md (beat-by-beat: VO, concept, camera, palette-mood) + HANDOFF.md. Adopt this doc trio as our director's output format.

## Immediate low-risk wins (either engine)
1. Storyteller: add planned silent beats + "silence is a feature" pacing.
2. Creative direction: distinctive font PER scene (not one TIGHT everywhere); allow light/warm home-base, not dark-default.
3. Lyria prompts: name the arc (pad-at-0 → swell → drop → resolve) + reference vibe.
4. Motion: push amplitude ("subtle reads as static at 30fps").

## Next-session first action
Run `/product-launch-video` (HyperFrames skill, now installed) on leadverse.ai → render → A/B vs `out/leadverse-v8.mp4`. That render makes the Option-A/B call.
Scratch env: `~/dev/hf-scratch` (Node 22 via nvm; launch-studio stays on 20.20.1). Launches source cloned there for reference reading.
