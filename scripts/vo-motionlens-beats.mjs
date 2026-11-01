// Per-beat Gemini TTS for MotionLens relaunch — one clip per beat, locked to its scene start (kills A/V drift).
// Usage: node scripts/vo-motionlens-beats.mjs [voice]
import "dotenv/config";
import { execFileSync } from "node:child_process";
import { writeFileSync, rmSync } from "node:fs";

const key = process.env.GEMINI_API_KEY;
const MODELS = ["gemini-2.5-flash-preview-tts", "gemini-3.1-flash-tts-preview"];
const VOICE = process.argv[2] || "Iapetus";
const DIR = "/Users/prabhas/dev/hf-scratch/motionlens-hf/assets/audio";

const BEATS = [
  ["01", "Your AI agent can build almost anything you describe."],
  ["02", "But it can't see motion. The timing. The easing. The feel between frames. To your agent, that's a blindspot."],
  ["03", "So you go back to hand-tuning. Every curve. Every millisecond. Guessing."],
  ["04", "MotionLens gives your agent eyes."],
  ["05", "Drop in any animation — a screen recording, or a live website. It reads the exact motion: every layer, every trigger, every curve — into one precise Blueprint."],
  ["06", "And it lives inside your workflow. One command installs it as an M-C-P server. Cursor. Claude Code. Windsurf. Now your agent reads motion straight from any clip. No copy-paste."],
  ["07", "Then watch it rebuild the animation."],
  ["08", "Pixel-perfect. Down to that exact six-hundred-millisecond ease."],
  ["09", "Not a guess. The real numbers, every time."],
  ["10", "You vibe-code the app. MotionLens handles the motion. Give your agent eyes. Start free at motionlens dot dev."],
];

const profile = `## AUDIO PROFILE
A senior engineer in their mid-30s demoing a tool he quietly loves. Calm, dry, low-mid pitch. Craig Federighi's restraint without the stagecraft. Never selling, never performing. Economy of words; a short natural pause at each sentence. No advertising energy, no smile-in-the-voice, no breathiness. Even, documentary pace.

Speak ONLY the line under TRANSCRIPT, nothing else.

#### TRANSCRIPT
`;

async function tts(text) {
  for (const model of MODELS) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: profile + text }] }],
          generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } } } }) });
    if (!res.ok) { console.error(model, res.status); continue; }
    const b64 = (await res.json()).candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (b64) return b64;
  }
  return null;
}
const measure = (p) => parseFloat(execFileSync("ffprobe", ["-v", "quiet", "-show_entries", "format=duration", "-of", "csv=p=0", p]).toString());

let cum = 0;
const rows = [];
for (const [id, line] of BEATS) {
  const b64 = await tts(line);
  if (!b64) { console.error(`beat ${id}: FAILED`); continue; }
  const raw = `/tmp/ml-${id}.pcm`, wav = `${DIR}/vo-${id}.wav`;
  writeFileSync(raw, Buffer.from(b64, "base64"));
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", raw, wav]);
  rmSync(raw);
  const d = measure(wav);
  rows.push({ id, d: +d.toFixed(2), startAtCum: +cum.toFixed(2) });
  cum += d;
  console.log(`beat ${id}: ${d.toFixed(2)}s  (raw cumulative ${cum.toFixed(2)}s)`);
  await new Promise((r) => setTimeout(r, 1200));
}
console.log("\nJSON:", JSON.stringify(rows));
console.log("total raw voice:", cum.toFixed(2) + "s");
