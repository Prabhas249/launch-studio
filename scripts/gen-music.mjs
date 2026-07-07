// Music via Lyria 3 — real generated track instead of the ffmpeg synth bed.
// Usage: node scripts/gen-music.mjs <domain>
// Reads runs/<domain>/film.json (music mood) → writes public/music/<domain>/track.wav + sets film.musicFile
import "dotenv/config";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const domain = process.argv[2];
if (!domain) {
  console.error("usage: node scripts/gen-music.mjs <domain>");
  process.exit(1);
}
const key = process.env.GEMINI_API_KEY;
const MODEL = process.env.MUSIC_MODEL ?? "lyria-3-clip-preview";
const runDir = join("runs", domain);
const musicDir = join("public", "music", domain);
mkdirSync(musicDir, { recursive: true });
const film = JSON.parse(readFileSync(join(runDir, "film.json"), "utf8"));

const PROMPTS = {
  pulse:
    "Bright punchy electronic groove, 120 BPM, tight kick on every beat, crisp hi-hats, minimal melodic synth stabs on offbeats, clean modern professional mix, energetic build in the middle with a satisfying drop, instrumental only, no vocals",
  heavy:
    "Dark cinematic halftime electronic beat, 120 BPM, heavy sub bass on the downbeat, sparse rimshot snare, moody atmospheric synth pad, tension building steadily to a hard drop, sleek tech product trailer energy, instrumental only, no vocals",
  adrenaline:
    "Driving high-energy electronic track, 120 BPM, relentless 16th-note hi-hats, punchy four-on-the-floor kick, aggressive bassline, riser building over eight bars into a big drop with impact, modern startup ad trailer energy, instrumental only, no vocals",
};
const prompt = PROMPTS[film.music ?? "pulse"] ?? PROMPTS.pulse;

console.log(`Lyria ${MODEL} · mood=${film.music}`);

async function generate(p) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: p }] }],
        generationConfig: { responseModalities: ["AUDIO"] },
      }),
    },
  );
  if (!res.ok) throw new Error(`Lyria ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.find((pt) => pt.inlineData) ?? null;
}

// copyright filter trips on style-reference phrasing — retry with progressively plainer prompts
const attempts = [
  prompt,
  prompt.replace(/,[^,]*(trailer|ad|product)[^,]*/gi, ""),
  "Uptempo instrumental electronic music, steady kick drum, hi-hats, synth bass, gradual energy build, clean mix, no vocals",
];
let part = null;
for (const p of attempts) {
  try {
    part = await generate(p);
  } catch (e) {
    console.error(String(e).slice(0, 200));
  }
  if (part) break;
  console.log("filtered/empty — retrying with plainer prompt");
}
if (!part) {
  console.error("all Lyria attempts filtered");
  process.exit(1);
}
const mime = part.inlineData.mimeType ?? "";
const buf = Buffer.from(part.inlineData.data, "base64");
console.log(`got ${buf.length} bytes, mime=${mime}`);

const rawExt = mime.includes("wav") ? "wav" : mime.includes("mp3") || mime.includes("mpeg") ? "mp3" : "bin";
const rawPath = join(musicDir, `raw.${rawExt}`);
writeFileSync(rawPath, buf);
const track = join(musicDir, "track.wav");
if (rawExt === "bin") {
  // assume 48k stereo PCM if unlabeled
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "s16le", "-ar", "48000", "-ac", "2", "-i", rawPath, track]);
} else {
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", rawPath, "-t", "32", "-af", "afade=t=out:st=29.5:d=2.5", track]);
}
rmSync(rawPath);

film.musicFile = `music/${domain}/track.wav`;
writeFileSync(join(runDir, "film.json"), JSON.stringify(film, null, 2));
console.log(`track: ${track} → film.musicFile set`);
