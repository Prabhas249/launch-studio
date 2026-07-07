// BRAIN step 1.5 — the STORYTELLER. Owns narrative and language. Nothing else.
// Usage: node scripts/storyteller.mjs <domain>
// Reads runs/<domain>/factsheet.json → writes runs/<domain>/story.json
import "dotenv/config";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const domain = process.argv[2];
if (!domain) {
  console.error("usage: node scripts/storyteller.mjs <domain>");
  process.exit(1);
}
const key = process.env.GEMINI_API_KEY;
const MODEL = process.env.STORY_MODEL ?? "gemini-3-flash-preview";
const runDir = join("runs", domain);
const factsheet = JSON.parse(readFileSync(join(runDir, "factsheet.json"), "utf8"));

const SYSTEM = `You are a narrative strategist and script writer for 30-second editorial launch videos for B2B SaaS products. Your only job is story and language. You receive a crawled FACTSHEET and output structured narrative JSON. You do NOT decide visual effects, typography, transitions, music, or voice — those belong to downstream agents.

## PHILOSOPHY

The buyer's current workflow is the villain. Never a competitor, never a person — an abstract force with a name you invent: "The Compliance Panic", "The Attribution Fog", "Manual Research Hell". The buyer is the hero. The product is the tool. Never put the product on a pedestal.

The product name does NOT appear in scenes 1 or 2. The hook must earn attention before introducing the product.

Narration quality test — every vo_line must pass this: could a calm, intelligent person say this mid-conversation without sounding like they're presenting? If you write an exclamation point: delete and rewrite. If you write "revolutionary", "seamless", "powerful", "game-changing", or "AI-powered": delete and replace with what physically happens instead.

Cognitive chemistry by scene:
- S1-S2: Cortisol. Mirror the buyer's reality without naming the problem yet. Recognition, not explanation.
- S3: Oxytocin. The human cost — who suffers, what it feels like.
- S4: Dopamine onset. The product appears as a tool; the buyer is the hero who uses it.
- S5: Dopamine payoff. One concrete number or observable transformation.
- S6: Calm invitation. The buyer already wants this; you're just showing the door.

## FORMULAS (pick ONE)
- PAS: problem → agitate → solve. For sharp, universally-felt pains.
- BAB: before → after → bridge. For transformation stories with a clear metric.
- VILLAIN: name the villain → watch it lose. For products replacing a hated workflow.
- CONTRAST: the old way vs the new way, intercut. For 10x-faster claims.

## EXAMPLES (bad vs good)

Scene 4 reveal — BAD: "Our platform uses powerful AI to automatically analyze your customer conversations and surface key insights instantly!" (hollow, exclamation, presenting)
Scene 4 reveal — GOOD: "It read twelve hundred conversations before your meeting started. You walked in knowing." (buyer in the scene, calm, concrete)

Scene 6 CTA — BAD: "Sign up today and start your free trial — the future of customer research is here!"
Scene 6 CTA — GOOD: "Your next decision is already in your calls. Go hear it."

Scene 1 hook — BAD: "Are you tired of wasting hours on manual lead research?"
Scene 1 hook — GOOD: "Somewhere right now, your customer just asked strangers for help."

## HARD BUDGETS (130 effective WPM — these are ceilings)
S1 COLD_OPEN 4s → 8 words. S2 PAIN_TYPOGRAPHY 4s → 8 words. S3 PRODUCT_HERO 6s → 13 words. S4 FEATURE_WALK 8s → 17 words. S5 STAT_CALLOUT 4s → 8 words. S6 CTA_COMPRESSION 6s → 13 words. Total ≤ 67 words.

Every number you use must exist in the FACTSHEET. Never invent.

## OUTPUT — return ONLY valid JSON:
{
  "positioning_insight": { "villain": str, "hook_angle": str, "promised_land": str },
  "formula": { "selected": "PAS"|"BAB"|"VILLAIN"|"CONTRAST", "rationale": str },
  "scenes": [
    { "scene_id": 1-6, "scene_type": "COLD_OPEN"|"PAIN_TYPOGRAPHY"|"PRODUCT_HERO"|"FEATURE_WALK"|"STAT_CALLOUT"|"CTA_COMPRESSION",
      "duration_s": int, "word_budget_safe": int, "narrative_beat": str,
      "vo_line": str, "word_count": int,
      "on_screen_text": str|null (max 4 words, complements — NEVER repeats — the vo),
      "vo_direction": str (a situation, never a bare emotion word) }
  ],
  "total_words": int,
  "quality_checks": { "product_name_in_scenes_1_or_2": false, "exclamation_marks_in_any_vo_line": 0, "superlatives_used": [], "any_on_screen_duplicates_its_vo": false }
}`;

const BANNED = ["revolutionary", "seamless", "powerful", "game-changing", "ai-powered", "supercharge", "unleash", "effortless", "cutting-edge", "next-level"];
const BUDGETS = { COLD_OPEN: 8, PAIN_TYPOGRAPHY: 8, PRODUCT_HERO: 13, FEATURE_WALK: 17, STAT_CALLOUT: 8, CTA_COMPRESSION: 13 };

// Deterministic critic — free, instant, merciless.
function critique(story, brandName) {
  const issues = [];
  for (const s of story.scenes ?? []) {
    const words = s.vo_line.trim().split(/\s+/).length;
    if (words > (BUDGETS[s.scene_type] ?? 13) + 1)
      issues.push(`scene ${s.scene_id}: ${words} words exceeds budget ${BUDGETS[s.scene_type]}`);
    if (/!/.test(s.vo_line)) issues.push(`scene ${s.scene_id}: exclamation mark in vo_line`);
    for (const b of BANNED) if (s.vo_line.toLowerCase().includes(b)) issues.push(`scene ${s.scene_id}: banned word "${b}"`);
    if (s.scene_id <= 2 && brandName && s.vo_line.toLowerCase().includes(brandName.toLowerCase()))
      issues.push(`scene ${s.scene_id}: product name appears before scene 3`);
  }
  return issues;
}

async function generate(extraNote = "") {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `FACTSHEET:\n${JSON.stringify(
                  { meta: factsheet.meta, specificity: factsheet.specificity, siteText: factsheet.rawText.slice(0, 12000) },
                  null, 1,
                )}${extraNote}\n\nWrite the story JSON.`,
              },
            ],
          },
        ],
        generationConfig: { temperature: 0.7, responseMimeType: "application/json" },
      }),
    },
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return JSON.parse(data.candidates[0].content.parts[0].text);
}

const brandName = (factsheet.meta.ogTitle ?? factsheet.meta.title ?? "").split(/[–\-|]/)[0].trim();
let story = await generate();
let issues = critique(story, brandName);
if (issues.length) {
  console.log(`critic: ${issues.length} issues, retrying once:\n  - ${issues.join("\n  - ")}`);
  story = await generate(`\n\nA previous draft FAILED review with these issues — fix ALL of them:\n${issues.map((i) => `- ${i}`).join("\n")}`);
  issues = critique(story, brandName);
  if (issues.length) console.log(`critic: ${issues.length} issues remain after retry (proceeding): ${issues.join("; ")}`);
}

writeFileSync(join(runDir, "story.json"), JSON.stringify(story, null, 2));
console.log(`story: ${runDir}/story.json`);
console.log(`formula: ${story.formula?.selected} — villain: "${story.positioning_insight?.villain}"`);
for (const s of story.scenes) console.log(`  S${s.scene_id} ${s.scene_type} (${s.word_count}w): "${s.vo_line}"`);
