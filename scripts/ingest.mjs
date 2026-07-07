// BRAIN step 1 — crawler + specificity miner.
// Usage: node scripts/ingest.mjs https://leadverse.ai
// Output: runs/<domain>/factsheet.json + public/shots/<domain>/*.png
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const url = process.argv[2];
if (!url) {
  console.error("usage: node scripts/ingest.mjs <url>");
  process.exit(1);
}
const domain = new URL(url).hostname.replace(/^www\./, "");
const shotsDir = join("public", "shots", domain);
const runDir = join("runs", domain);
mkdirSync(shotsDir, { recursive: true });
mkdirSync(runDir, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(3500);

// — screenshots: hero + section states
const shots = [];
await page.screenshot({ path: join(shotsDir, "hero.png") });
shots.push(`shots/${domain}/hero.png`);
const height = await page.evaluate(() => document.body.scrollHeight);
for (let i = 1; i <= 4; i++) {
  await page.evaluate((y) => window.scrollTo({ top: y }), (height / 5) * i);
  await page.waitForTimeout(1200);
  const name = `s${i}.png`;
  await page.screenshot({ path: join(shotsDir, name) });
  shots.push(`shots/${domain}/${name}`);
}

// — meta + full text
const meta = await page.evaluate(() => {
  const get = (sel, attr = "content") => document.querySelector(sel)?.getAttribute(attr) ?? null;
  return {
    title: document.title,
    description: get('meta[name="description"]') ?? get('meta[property="og:description"]'),
    ogTitle: get('meta[property="og:title"]'),
    ogImage: get('meta[property="og:image"]'),
    themeColor: get('meta[name="theme-color"]'),
  };
});
const rawText = await page.evaluate(() => document.body.innerText.slice(0, 20000));

// — brand color candidates from CTA-ish elements
const colorCandidates = await page.evaluate(() => {
  const els = [...document.querySelectorAll('button, a[class*="btn" i], a[class*="cta" i], [class*="primary" i]')].slice(0, 40);
  const counts = {};
  for (const el of els) {
    const bg = getComputedStyle(el).backgroundColor;
    if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "rgb(255, 255, 255)") counts[bg] = (counts[bg] ?? 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
});
await browser.close();

// — specificity mining (regex tier; the director LLM does the semantic tier)
const numbers = [...rawText.matchAll(/(?:[$₹€]\s?)?\d[\d,.]*\s?(?:%|\+|x|×|k|K|M|users?|customers?|businesses|teams|companies|hours?|minutes?|seconds?|days?|leads?|reviews?)?/g)]
  .map((m) => m[0].trim())
  .filter((s) => s.length > 1 && /\d/.test(s))
  .slice(0, 80);
const properNouns = [...new Set([...rawText.matchAll(/\b([A-Z][a-zA-Z]+(?:\.[a-z]{2,3})?)\b/g)].map((m) => m[1]))].slice(0, 120);

const factsheet = {
  url,
  domain,
  crawledAt: new Date().toISOString(),
  meta,
  colorCandidates,
  shots,
  specificity: {
    numericCandidates: numbers,
    properNounCandidates: properNouns,
    // pre-crawl audit signal (research: 20-30% of sites fail this)
    numericCount: numbers.length,
    audit: numbers.length < 5 ? "WEAK — site lacks concrete numbers; ask founder for real metrics before generating" : "OK",
  },
  rawText,
};
writeFileSync(join(runDir, "factsheet.json"), JSON.stringify(factsheet, null, 2));
console.log(`factsheet: ${runDir}/factsheet.json`);
console.log(`shots: ${shots.length} · specificity audit: ${factsheet.specificity.audit} (${numbers.length} numeric candidates)`);
