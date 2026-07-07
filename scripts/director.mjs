// BRAIN step 2 — the creative director.
// Usage: GEMINI_API_KEY=... node scripts/director.mjs leadverse.ai
// Reads runs/<domain>/factsheet.json → writes runs/<domain>/film.json
import "dotenv/config";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const domain = process.argv[2];
if (!domain) {
  console.error("usage: node scripts/director.mjs <domain>");
  process.exit(1);
}
const key = process.env.GEMINI_API_KEY;
if (!key) {
  console.error("GEMINI_API_KEY not set");
  process.exit(1);
}
const MODEL = process.env.DIRECTOR_MODEL ?? "gemini-3-flash-preview";
const runDir = join("runs", domain);
const factsheet = JSON.parse(readFileSync(join(runDir, "factsheet.json"), "utf8"));

const SYSTEM = `You are the creative director for 30-second editorial motion-design launch videos (the Skale/ListenLabs genre on X).
You write a scene script as JSON. You NEVER animate — a render engine executes your JSON.

NON-NEGOTIABLE RULES:
1. SPECIFICITY IS THE VETO RULE. Every text you write must contain a real number, a real feature name, or a real named platform FROM THE FACTSHEET. Banned forever: "powered by AI", "streamline", "boost productivity", "save time", "revolutionize", any claim not grounded in the factsheet. If you invent a number, the video is rejected.
2. STORY ARC: hook (a sharp, specific tension — never the product name) → pain (the old way, 2-3 concrete behaviors) → reveal → 2-3 features as user actions → one REAL stat → CTA using the site's own strongest phrase.
3. VOICE: short, punchy, second person. Hook words: 4-6 items, one word/short phrase each, the LAST one gets accent=true and must be the sharpest word.
4. Screenshots: choose from factsheet.shots — hero for PRODUCT_HERO, inner/product states for FEATURE_WALK.
4b. NARRATION ("vo" field on EVERY scene): you are also the scriptwriter. Write a voiceover line per scene that — read in order — forms ONE flowing 60-80 word story a human narrator tells. NEVER copy the on-screen text or website copy; the VO complements what's on screen. Contractions always. Each line ≤ 10 words (FEATURE_WALK may be ≤ 20). Punctuation is pacing: ellipsis = suspense, em-dash = pivot, period = hard stop. The CTA vo ends with the domain spoken aloud.

5. ART DIRECTION — you make real choices here, and videos for different brands MUST NOT look alike:
   - "stylePack": "editorial_cream" (light, editorial — DEFAULT for friendly/consumer/marketing tools) or "dark_terminal" (near-black, technical — for dev tools, infra, AI/agents products).
   - "music": "pulse" (bright four-on-floor), "heavy" (halftime, dark — fits dark_terminal), or "adrenaline" (fast 16th-note ad energy — DEFAULT for bold products).
   - Scene variants — CHOOSE deliberately; you MUST use at least 2 non-default variants per film where they fit the story: COLD_OPEN "word_per_beat" (staccato tension), "marquee" (one giant sliding statement), "terminal" (console types the hook w/ keystroke sounds — dev/AI/technical products, hook ≤ 40 chars), or "search" (a Google-style bar types the desperate query a buyer would search + ENTER slam — PERFECT when the product is discovered via search/social; set "query" to that search, ≤ 45 chars). PAIN_TYPOGRAPHY "circle_swap" or "strike_list" (crossing out the old way). PRODUCT_HERO "window_slam" (one hero shot), "bento" (3-shot grid — needs extraShots), or "phone" (device mockup — mobile-first products, needs the mobile screenshot if available). STAT_CALLOUT "odometer" (counting up) or "repeat_stack" (number repeated as giant type wall — money/impressive counts).
   - Accent: the most vivid, saturated brand color from colorCandidates/vividColor as hex — never near-black, never near-white, never gray.

OUTPUT: raw JSON only, no markdown fences, exactly this shape:
{
  "brand": { "name": str, "domain": str, "colors": { "bg": "#F4EFE4", "fg": "#101010", "accent": <vivid hex>, "muted": "#8A867A" } },
  "stylePack": "editorial_cream" | "dark_terminal",
  "music": "pulse" | "heavy",
  "scenes": [
    { "type": "COLD_OPEN", "vo": str, "variant": "word_per_beat"|"marquee"|"terminal"|"search", "query": str ("" unless search), "words": [{"t": str, "accent": bool}...], "kicker": str },
    { "type": "PAIN_TYPOGRAPHY", "vo": str, "variant": "circle_swap"|"strike_list", "label": str, "lines": [str, str] },
    { "type": "PRODUCT_HERO", "vo": str, "variant": "window_slam"|"bento"|"phone", "headline": "Meet X|suffix.", "screenshot": str, "extraShots": [str, str] (bento only, else []), "chip": str },
    { "type": "FEATURE_WALK", "vo": str, "steps": [{"screenshot": str, "title": str} x3] },
    { "type": "STAT_CALLOUT", "vo": str, "variant": "odometer"|"repeat_stack", "value": number, "prefix": ""|"$"|"₹", "suffix": str },
    { "type": "CTA_COMPRESSION", "vo": str, "headline": str (may contain \\n), "domain": str, "sub": str }
  ]
}`;

const body = {
  systemInstruction: { parts: [{ text: SYSTEM }] },
  contents: [
    {
      role: "user",
      parts: [
        {
          text: `FACTSHEET:\n${JSON.stringify(
            {
              meta: factsheet.meta,
              colorCandidates: factsheet.colorCandidates,
              shots: factsheet.shots,
              specificity: factsheet.specificity,
              siteText: factsheet.rawText.slice(0, 12000),
            },
            null,
            1,
          )}\n\nWrite the film JSON.`,
        },
      ],
    },
  ],
  generationConfig: { temperature: 0.8, responseMimeType: "application/json" },
};

const res = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
  { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
);
if (!res.ok) {
  console.error(`Gemini ${res.status}: ${await res.text()}`);
  process.exit(1);
}
const data = await res.json();
const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
if (!text) {
  console.error("No text in response:", JSON.stringify(data).slice(0, 500));
  process.exit(1);
}
const film = JSON.parse(text);

// Basic contract checks (full zod validation happens in the app)
const types = film.scenes.map((s) => s.type);
const required = ["COLD_OPEN", "PRODUCT_HERO", "STAT_CALLOUT", "CTA_COMPRESSION"];
for (const t of required) if (!types.includes(t)) throw new Error(`director omitted ${t}`);

// Style pack lock + accent contrast guard (LLMs pick near-black accents from nav buttons)
film.brand.colors.bg = "#F4EFE4";
film.brand.colors.fg = "#101010";
film.brand.colors.muted = "#8A867A";
const hexToRgb = (h) => {
  const m = h.replace("#", "");
  return [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)];
};
const vividness = ([r, g, b]) => {
  const mx = Math.max(r, g, b) / 255;
  const mn = Math.min(r, g, b) / 255;
  const sat = mx === 0 ? 0 : (mx - mn) / mx;
  return sat * mx; // saturated AND bright
};
let accent = film.brand.colors.accent ?? "";
let rgb = /^#[0-9a-fA-F]{6}$/.test(accent) ? hexToRgb(accent) : [0, 0, 0];
if (vividness(rgb) < 0.35) {
  // priority: pixel-sampled vivid color from the hero screenshot
  if (factsheet.vividColor && vividness(hexToRgb(factsheet.vividColor)) >= 0.35) {
    accent = factsheet.vividColor;
    console.log(`accent guard: replaced ${film.brand.colors.accent} → ${accent} (hero pixel sample)`);
  } else {
    const parsed = (factsheet.colorCandidates ?? [])
      .map(([c]) => c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/))
      .filter(Boolean)
      .map((m) => [Number(m[1]), Number(m[2]), Number(m[3])]);
    const best = parsed.sort((a, b) => vividness(b) - vividness(a))[0];
    if (best && vividness(best) >= 0.35) {
      accent = `#${best.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
      console.log(`accent guard: replaced ${film.brand.colors.accent} → ${accent} (CTA style)`);
    } else {
      accent = "#2A48F0";
      console.log(`accent guard: no vivid candidate, using fallback ${accent}`);
    }
  }
  film.brand.colors.accent = accent;
}

writeFileSync(join(runDir, "film.json"), JSON.stringify(film, null, 2));
console.log(`film: ${runDir}/film.json`);
console.log(`Render: npx remotion render GrammarFilm out/${domain}.mp4 --props=runs/${domain}/film.json`);
