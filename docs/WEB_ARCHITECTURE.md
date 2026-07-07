# WEB_ARCHITECTURE.md — Hosted Product Architecture

> Engine: HyperFrames (Apache 2.0) on Vercel Sandbox + Blob
> Product: paste URL → cloud render → MP4 URL, no terminal required
> Reference implementation: `/Users/prabhas/dev/hf-scratch/hyperframes-vercel-template/`
> Written: Jul 7, 2026

---

## 1. The Problem This Architecture Solves

Vercel Functions cap at 50 MB compressed bundle and 300 s wall time. A HyperFrames render needs:
- Chromium (~150 MB) + FFmpeg (~80 MB) — cannot ship in a function bundle
- 4–8 minutes of compute for a 30–60 s launch video — exceeds 300 s

Solution: **Vercel Sandbox** (Firecracker microVM). A sandbox is a full Linux VM that lives outside the function bundle ceiling and runs up to 5 hours. The trick is a **pre-baked snapshot**: at deploy time, Chromium + FFmpeg + HyperFrames are installed once and frozen. At request time, the snapshot restores in ~100 ms and the render runs immediately.

---

## 2. Two-Phase Architecture

### Phase 1 — Build Time (runs once per `vercel deploy`)

```
vercel deploy
  └── npm run build
        └── next build
        └── tsx scripts/create-snapshot.ts
              ├── Sandbox.create({ runtime: 'node22', vcpus: 4 })
              ├── dnf install -y [14 Chromium system libs]
              ├── npm install hyperframes ffmpeg-static ffprobe-static
              ├── ln -sf ffmpeg → /usr/local/bin/ffmpeg
              ├── ln -sf ffprobe → /usr/local/bin/ffprobe
              ├── npx hyperframes browser ensure   (downloads chrome-headless-shell)
              ├── sandbox.snapshot({ expiration: 7 days })  → snapshotId
              └── put('snapshot-cache/<VERCEL_DEPLOYMENT_ID>.json', { snapshotId })
                    → stored in Vercel Blob
```

The resulting snapshot is ~1.1 GB. It is tied to one deployment via `VERCEL_DEPLOYMENT_ID`. Every new `vercel deploy` produces a new snapshot — the 7-day TTL means you must deploy at least weekly or production will throw `snapshot restore failed in production` with no fallback.

### Phase 2 — Request Time

```
POST /api/jobs  ──── enqueue ────► QStash → /api/workers/crawl
  │                                                │
  │  return { jobId }                              ▼
  │                                     /api/workers/crawl
  │                                       ├── Firecrawl(url) → text + screenshots
GET /api/jobs/[id]  ◄── poll ──────      ├── storyteller LLM (Claude Haiku) → script JSON
  │  { status, url }                     ├── art-director LLM (Claude Sonnet) → scene JSON
  │                                      ├── composeFromSceneJSON() → compositionFiles[]
  │                                      ├── Gemini TTS → per-scene .mp3 → Blob URLs
  │                                      ├── Lyria BGM → .mp3 → Blob URL
  │                                      ├── update job: status='rendering'
  │                                      └── enqueue → QStash → /api/workers/render
  │
  │                                    /api/workers/render
  │                                      ├── renderInSandbox(compositionFiles)
  │                                      │     ├── restoreOrCreate()  [~100ms]
  │                                      │     ├── sandbox.writeFiles(...)
  │                                      │     ├── hyperframes render composition -o out.mp4
  │                                      │     └── sandbox.readFileToBuffer('out.mp4')
  │                                      ├── put('renders/<userId>/<jobId>.mp4', mp4)
  └── ◄────────────── status='done', url=blobUrl ──┘
```

---

## 3. Full Step-by-Step Request Flow

### Step 0 — Job Intake (`POST /api/jobs`)
- Vercel Function, `maxDuration: 60`
- Parse `{ url }` from request body
- Insert row into Supabase `jobs` table: `{ id, url, status: 'queued', user_id, created_at }`
- Enqueue to Upstash QStash targeting `/api/workers/crawl` with `{ jobId, url }`
- Return `{ jobId }` immediately — client polls from here

### Step 1 — Crawl + LLM Pipeline (`/api/workers/crawl`)
- Vercel Function, `maxDuration: 300`
- QStash delivers `{ jobId, url }` with signature verification
- **Crawl:** call Firecrawl API (`firecrawl.dev`) — returns page text, meta title/description, OG image URL, extracted numeric claims. No Chromium needed here — Firecrawl handles rendering server-side.
- **Specificity audit:** count numeric claims + named integrations. If below threshold → update job `{ status: 'audit_failed', reason: '...' }` and halt. Surface this to the user as a product moment before they wait for a render.
- **Storyteller LLM:** Claude Haiku with the specificity engine system prompt → JSON script with scenes: `{ id, narration, duration_s, visual_intent, archetype }`. 6 archetypes: COLD_OPEN, PAIN_TYPOGRAPHY, PRODUCT_HERO, FEATURE_WALK, STAT_CALLOUT, CTA_COMPRESSION.
- **Art-director LLM:** Claude Sonnet 4.5 with the HyperFrames sub-composition system prompt → per-scene HTML files (the `compositionFiles[]` array).
- **Audio generation:** Gemini TTS per scene narration → `assets/vo-<sceneId>.mp3` uploaded to Blob. Lyria BGM → `assets/bgm.mp3` uploaded to Blob. Blob URLs are embedded as `src` attributes in `index.html` before render.
- **Assemble:** `composeFromSceneJSON()` returns `Array<{ rel: string; content: Buffer }>` — `index.html` at root, `compositions/<sceneId>.html` per scene, audio Blob URLs wired in.
- Update job: `{ status: 'rendering' }`, store `compositionFiles` reference (or re-derive from stored scene JSON)
- Enqueue to QStash → `/api/workers/render`

### Step 2 — Sandbox Render (`/api/workers/render`)
- Vercel Function, `maxDuration: 800` (Vercel Pro required)
- QStash delivers `{ jobId }`
- Load `compositionFiles` (either from Supabase JSONB column or re-call `composeFromSceneJSON` with stored scene JSON)
- Call `renderInSandbox(compositionFiles)` — this is the unmodified function from `lib/sandbox.ts`:
  1. `restoreOrCreate()` → reads `snapshot-cache/<VERCEL_DEPLOYMENT_ID>.json` from Blob → `Sandbox.create({ source: { type: 'snapshot', snapshotId }, timeout: 10min, vcpus: 4 })`
  2. `sandbox.writeFiles(files.map(f => ({ path: 'composition/' + f.rel, content: f.content })))`
  3. `sandbox.runCommand({ cmd: 'npx', args: ['--no-install', 'hyperframes', 'render', 'composition', '-o', 'out.mp4', '--workers', '4'] })`
  4. `sandbox.readFileToBuffer({ path: 'out.mp4' })` → Node Buffer
  5. `sandbox.stop()` in finally block
- Upload: `put('renders/<userId>/<jobId>.mp4', mp4, { access: 'public', contentType: 'video/mp4', addRandomSuffix: false })` — content-addressed key means identical scene JSON → identical key → can skip re-render
- Update job: `{ status: 'done', url: blob.url }`

### Step 3 — Polling (`GET /api/jobs/[id]`)
- Edge Function, no auth concern (job IDs are UUIDs; row-level security on Supabase filters by `user_id`)
- Returns `{ status: 'queued' | 'crawling' | 'rendering' | 'done' | 'failed' | 'audit_failed', url?, reason? }`
- Client polls every 3 s; on `done` → displays the MP4 URL inline

---

## 4. The Snapshot Approach — Why It Exists

The Vercel Sandbox snapshot is the only reason this architecture is affordable and fast.

| Without snapshot | With snapshot |
|---|---|
| Every request: fresh Linux VM + 15 min setup | Every request: restore in ~100 ms |
| Chromium download on each render | Pre-installed, frozen |
| Setup cost ~$0.50/render (wasted VM-minutes) | Setup cost $0 at request time |
| First request fails (timeout) | Every request is warm |

The snapshot is tagged to `VERCEL_DEPLOYMENT_ID`. If you deploy multiple times per day, each deployment gets its own snapshot — this is fine, old snapshots expire after 7 days. The pointer blob `snapshot-cache/<deploymentId>.json` is what maps a live deployment to its snapshot.

**TTL risk:** if the project goes >7 days without a new deployment, production will throw on the next render with no fallback. Guard against this by either: (a) scheduling a weekly no-op deploy via `vercel deploy --force`, or (b) extending `SNAPSHOT_TTL_MS` in `create-snapshot.ts`.

**Preview vs. production:** in `VERCEL_ENV !== 'production'`, the sandbox falls back to a fresh cold setup when the snapshot is missing. This means preview deployments work but render slowly. If CI time matters, guard `create-snapshot.ts` with `if (process.env.VERCEL_ENV !== 'production') process.exit(0)` to skip snapshot creation on preview branches.

---

## 5. How Our Pipeline Maps onto the Template

| Template stage | Our adaptation |
|---|---|
| `collectFiles(PREVIEW_COMPOSITION_DIR)` | `composeFromSceneJSON(sceneJSON)` — returns the same `Array<{rel, content}>` shape built dynamically from LLM output |
| Static composition in `public/compositions/` | No static compositions. All files generated at job-time in memory |
| Single `POST /api/render` route (synchronous) | Three chained QStash workers (crawl → render → done) — async, survives 300 s limit |
| No job tracking | Supabase `jobs` table + SSE or polling |
| `put('renders/render.mp4', ...)` | `put('renders/<userId>/<jobId>.mp4', ...)` — namespaced, no random suffix needed |
| Browser Studio preview | Not needed for v1. Can be added later pointing at dynamically-composed files |

### The `composeFromSceneJSON` contract

This is the only novel function relative to the template. It takes the art-director's scene JSON and returns files that `renderInSandbox` accepts unchanged:

```typescript
type CompositionFile = { rel: string; content: Buffer };

async function composeFromSceneJSON(params: {
  scenes: SceneJSON[];        // art-director output: id, duration_s, htmlContent
  voiceUrls: Record<string, string>;  // sceneId → Blob URL for VO mp3
  bgmUrl: string;             // Blob URL for Lyria BGM mp3
  width?: number;             // default 1920
  height?: number;            // default 1080
}): Promise<CompositionFile[]> {
  const files: CompositionFile[] = [];

  // 1. Each scene sub-comp → compositions/<id>.html
  for (const scene of params.scenes) {
    files.push({
      rel: `compositions/${scene.id}.html`,
      content: Buffer.from(scene.htmlContent),
    });
  }

  // 2. Assemble index.html (orchestrator)
  //    - one data-composition-src slot per scene (track-index 1)
  //    - one <audio> per scene VO (track-index 10), src=voiceUrls[scene.id]
  //    - one <audio> for BGM (track-index 11), src=bgmUrl
  //    - cumulative data-start per scene
  const indexHtml = assembleIndexHtml(params);
  files.push({ rel: 'index.html', content: Buffer.from(indexHtml) });

  return files;
}
```

The `assembleIndexHtml` function replicates the logic of `hyperframes/skills/product-launch-video/scripts/assemble-index.mjs` — it calculates cumulative start times from `scene.duration_s`, emits `<div class="clip" data-composition-src="compositions/<id>.html" data-start="..." data-duration="..." data-track-index="1">`, and places audio elements at the root.

---

## 6. Async Queue — Why We Need It

The template's single `POST /api/render` (maxDuration 300) works for the 11 s demo. Our pipeline is:

| Stage | Estimated time | Route |
|---|---|---|
| Crawl (Firecrawl API) | 5–15 s | `/api/workers/crawl` |
| Storyteller LLM (Haiku) | 3–8 s | same |
| Art-director LLM (Sonnet, per-scene parallel) | 10–30 s | same |
| Gemini TTS × N scenes | 10–20 s | same |
| Lyria BGM | 5–15 s | same |
| Sandbox render (30s video) | 5–7 min | `/api/workers/render` |
| Sandbox render (60s video) | 9–11 min | `/api/workers/render` |

Total: 7–13 minutes. A synchronous HTTP route cannot hold this. QStash (Upstash) delivers the job to each worker with retries and signature verification — each worker runs within its own `maxDuration` budget. The crawl+LLM worker fits in 300 s on Vercel Pro (lower plans limit to 60 s). The render worker needs `maxDuration: 800` which requires Vercel Pro.

**QStash setup:** one topic per stage. Workers verify the `Upstash-Signature` header before processing. On failure, QStash retries with exponential backoff (default 3 retries). Job status in Supabase is the source of truth — not QStash delivery state.

---

## 7. Env / Setup

### Required environment variables

```
# Auto-injected by Vercel when Blob store is attached
BLOB_READ_WRITE_TOKEN=

# Auto-injected at runtime on Vercel (sandbox auth)
VERCEL_OIDC_TOKEN=

# Auto-injected — identifies this deployment for snapshot pointer lookup
VERCEL_DEPLOYMENT_ID=

# Auto-injected — 'production' | 'preview' | 'development'
VERCEL_ENV=

# QStash (Upstash) — job queue
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=
QSTASH_CURRENT_SIGNING_KEY=
QSTASH_NEXT_SIGNING_KEY=

# Supabase — job tracking + user auth
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# LLM
ANTHROPIC_API_KEY=

# Crawl
FIRECRAWL_API_KEY=

# TTS + music
GOOGLE_CLOUD_PROJECT=      # for Gemini TTS + Lyria via Vertex AI
GOOGLE_APPLICATION_CREDENTIALS=  # service account JSON path (local only)
```

### Local dev setup

```bash
# Pull all Vercel env vars (including OIDC token for sandbox auth)
vercel env pull .env.local

# Run dev server
npm run dev

# Note: in local dev, sandbox.ts falls back to cold setup (no snapshot).
# First render locally takes ~15 min. Subsequent runs reuse the sandbox
# within the same process if you cache the sandbox object — or just
# test against a preview deployment for render fidelity.
```

### Supabase schema

```sql
create table jobs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  url         text not null,
  status      text not null default 'queued',
  -- queued | crawling | rendering | done | failed | audit_failed
  reason      text,            -- audit_failed message
  scene_json  jsonb,           -- stored after art-director step
  result_url  text,            -- Vercel Blob URL when done
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table jobs enable row level security;
create policy "users see own jobs" on jobs
  for all using (auth.uid() = user_id);
```

---

## 8. Cost Math

### Sandbox compute

Based on the template README and timing findings:

| Video length | Render time (4 vCPU) | Sandbox cost estimate |
|---|---|---|
| 11 s (template demo) | ~2 min | ~$0.08 |
| 30 s | ~5–7 min | ~$0.25–0.35 |
| 60 s | ~9–11 min | ~$0.45–0.55 |
| 90 s | ~13–16 min | ~$0.65–0.80 |

Vercel Pro includes $20/month Sandbox credit. At 30 s videos (~$0.30/render) that is ~65 renders/month included before pay-as-you-go. Snapshot storage (~1.1 GB per deployment) is included in Sandbox pricing.

At our likely price point ($10–25/video or $29–79/mo subscription), even $1 COGS per render is fine margin. Compute is not the binding constraint — render time ceiling is.

### LLM costs (per render)

| Step | Model | Estimated tokens | Estimated cost |
|---|---|---|---|
| Storyteller | Claude Haiku 3.5 | ~4k in / 1k out | ~$0.003 |
| Art-director (3–6 scenes parallel) | Claude Sonnet 4.5 | ~8k in / 6k out per scene | ~$0.15–0.30 |
| Total LLM | — | — | ~$0.15–0.30 |

### Audio costs

- Gemini TTS: ~$0.000016/char at standard pricing; a 60 s video with ~150 words ≈ 750 chars → ~$0.01
- Lyria music: ~$0.08/track (Vertex AI pricing as of Jul 2026)

### Total COGS per render (30–60 s video)

| Component | Cost |
|---|---|
| Sandbox compute | $0.25–0.55 |
| LLM (art-director) | $0.15–0.30 |
| TTS | ~$0.01 |
| Lyria BGM | ~$0.08 |
| Firecrawl (crawl) | ~$0.01 |
| **Total** | **$0.50–0.95** |

Healthy at any price point above $5/render.

---

## 9. Render Timing Ceiling — The Hard Constraint

The Vercel Function `maxDuration` ceiling is the binding constraint, not cost.

| Plan | maxDuration | Max video length (HyperFrames) |
|---|---|---|
| Vercel Hobby | 60 s | Not viable |
| Vercel Pro | 800 s | ~60–70 s video |
| Vercel Enterprise | 900 s | ~70–80 s video |

For videos above ~60 s, the AWS Lambda path is the right answer:

```bash
npx hyperframes lambda deploy --stack-name=launch-studio-prod --region=us-east-1 \
  --concurrency=8 --memory=10240

npx hyperframes lambda render ./composition --width 1920 --height 1080 --wait
```

Lambda distributes render across parallel workers (up to 16), cutting render time proportionally. Step Functions handles the plan → renderChunk × N → assemble pipeline. For MVP (videos ≤ 60 s), the Vercel Sandbox path is simpler — no AWS account, no SAM stack, no S3 bucket. Add Lambda only when customer demand proves the need for longer videos.

**Worker count on 4-vCPU sandbox:** `--workers auto` resolves to 2–4 workers depending on frame count and memory. Pass `--workers 4` explicitly to match vCPU count and skip the auto-calibration Chrome probe (saves ~3 s).

---

## 10. HyperFrames vs Remotion in the Sandbox — Honest Comparison

We currently use Remotion for rendering. The option to keep Remotion and run it in the sandbox instead of HyperFrames is valid — the sandbox is just a Linux VM. Here is the honest comparison:

| Dimension | HyperFrames in Sandbox | Remotion in Sandbox |
|---|---|---|
| Bundle size | HyperFrames CLI + hyperframes npm package — small | `@remotion/renderer` + Puppeteer — large but manageable inside the VM |
| Render mechanism | Headless Chrome seeks composition frame-by-frame via `window.__timelines[tl].totalTime(t)` | Puppeteer opens each frame, Remotion's React renderer hydrates, screenshots |
| Determinism | Guaranteed by the seek contract | Guaranteed by Remotion's own seek contract |
| Agent-native output | HTML/CSS/GSAP — LLM writes plain text files | JSX/TypeScript — LLM writes React components |
| Composition format | HTML data-attributes + GSAP timelines | React components with `useCurrentFrame()` |
| Existing render code | Must rewrite all Remotion scene components as HTML files | Keep existing scenes, add sandbox wrapper |
| License cost | Apache 2.0, no per-render fee regardless of company size | Source-available; company license required above threshold (currently ~$100/mo) |
| 50+ registry blocks | Yes — `npx hyperframes add <block>` installs pre-built scenes | No equivalent |
| Browser Studio editor | Yes — built-in timeline editor, no extra work | Remotion Studio is excellent but separate from the render path |
| Error surface for LLM | ~10 data-attributes + GSAP rules | React component API + Remotion API |

**The real decider:** run `npx skills add heygen-com/hyperframes && hyperframes-skill /product-launch-video leadverse.ai` on the `leadverse.ai` test URL. Compare the output to our current Remotion-rendered `out/leadverse-v8.mp4`. If their engine + our brain beats our engine + our brain, port. If our tuned storyteller holds the quality gap, keep Remotion and mine HyperFrames for methodology only.

The architecture documented above works for both engines — `renderInSandbox()` accepts `Array<{rel, content}>` regardless of what generated the files. The only change is whether `composeFromSceneJSON()` outputs HTML files or `.tsx` + a `bundle()` step.

---

## 11. Files to Create / Fork

Starting from the vercel-template, these are the files that change:

```
launch-studio/
├── app/
│   ├── api/
│   │   ├── jobs/
│   │   │   ├── route.ts          # NEW: POST → create job + enqueue
│   │   │   └── [id]/
│   │   │       └── route.ts      # NEW: GET → poll job status
│   │   └── workers/
│   │       ├── crawl/
│   │       │   └── route.ts      # NEW: QStash worker (crawl + LLM + audio)
│   │       └── render/
│   │           └── route.ts      # NEW: QStash worker (sandbox render)
│   └── page.tsx                  # NEW: URL input + progress UI + player
├── lib/
│   ├── sandbox.ts                # FORK from template — unchanged
│   ├── compose.ts                # NEW: composeFromSceneJSON()
│   ├── storyteller.ts            # NEW: Claude Haiku → script JSON
│   ├── art-director.ts           # NEW: Claude Sonnet → scene HTML files
│   ├── audio.ts                  # NEW: Gemini TTS + Lyria → Blob URLs
│   └── crawl.ts                  # NEW: Firecrawl wrapper + specificity audit
├── scripts/
│   └── create-snapshot.ts        # FORK from template — optional: skip on preview
├── package.json                  # add: @vercel/sandbox @vercel/blob @supabase/supabase-js
│                                 #      @upstash/qstash firecrawl @anthropic-ai/sdk
└── .env.example                  # extend with all vars listed in §7
```

`lib/sandbox.ts` is copied verbatim from `hyperframes-vercel-template/lib/sandbox.ts`. Do not modify it — the interface is stable and the snapshot/restore logic is correct.

---

## 12. Quick-Start Checklist

- [ ] Fork `hyperframes-vercel-template` into `launch-studio` (or copy `lib/sandbox.ts` + `scripts/create-snapshot.ts`)
- [ ] `vercel link` + attach Vercel Blob store (auto-injects `BLOB_READ_WRITE_TOKEN`)
- [ ] Create Upstash QStash account → paste tokens into Vercel env vars
- [ ] Create Supabase project → run jobs schema from §7 → paste keys into env vars
- [ ] Add `ANTHROPIC_API_KEY`, `FIRECRAWL_API_KEY`, GCP credentials
- [ ] Upgrade to Vercel Pro → set `maxDuration: 800` on `/api/workers/render`
- [ ] Write `lib/compose.ts` starting with a hard-coded 3-scene test composition (no LLM yet) — verify the full sandbox round-trip produces a valid MP4
- [ ] Wire storyteller (Haiku) + art-director (Sonnet) once the mechanical pipeline proves out
- [ ] Add specificity audit gate before LLM spend
- [ ] Deploy — first deploy triggers snapshot creation (~15 min build); subsequent deploys ~2 min
