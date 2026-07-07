// ONE continuous narration for the whole film — flow, single tone, no per-scene whiplash.
// Generates the read in several candidate voices for A/B, sets film.voFull to the chosen one.
// Usage: node scripts/voiceover-full.mjs <domain> [voiceName]
import "dotenv/config";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const domain = process.argv[2];
const pickedVoice = process.argv[3];
if (!domain) {
  console.error("usage: node scripts/voiceover-full.mjs <domain> [voice]");
  process.exit(1);
}
const key = process.env.GEMINI_API_KEY;
const MODELS = ["gemini-2.5-flash-preview-tts", "gemini-3.1-flash-tts-preview"];
const CANDIDATES = pickedVoice ? [pickedVoice] : ["Iapetus", "Schedar", "Charon"];
const runDir = join("runs", domain);
const voDir = join("public", "vo", domain);
mkdirSync(voDir, { recursive: true });
const film = JSON.parse(readFileSync(join(runDir, "film.json"), "utf8"));
const story = JSON.parse(readFileSync(join(runDir, "story.json"), "utf8"));

// Full script: scenes joined with paragraph breaks (breaks = natural pauses)
const script = story.scenes.map((s) => s.vo_line).join("\n\n");

// Anti-announcer, anti-sultry direction. Plain human. One take.
const PROMPT = `## AUDIO PROFILE
A documentary narrator in their 30s. Plain, dry, intelligent. Talks like a real person explaining something they find genuinely interesting — never selling, never performing, never intimate.

## HARD RULES
- NO breathiness. NO sultry or intimate tone. NO advertising energy. NO smile-in-the-voice.
- Even, natural pace throughout — like narrating a well-made documentary.
- Paragraph breaks are beats: take a short natural pause at each.
- Neutral accent, medium pitch, consistent energy start to finish.

Speak ONLY the lines under TRANSCRIPT, as one continuous take.

#### TRANSCRIPT
${script}`;

async function tts(voice) {
  for (const model of MODELS) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: PROMPT }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
          },
        }),
      },
    );
    if (!res.ok) continue;
    const data = await res.json();
    const b64 = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (b64) return b64;
  }
  return null;
}

const measure = (p) =>
  parseFloat(execFileSync("ffprobe", ["-v", "quiet", "-show_entries", "format=duration", "-of", "csv=p=0", p]).toString());

for (const voice of CANDIDATES) {
  const b64 = await tts(voice);
  if (!b64) {
    console.error(`${voice}: failed`);
    continue;
  }
  const raw = join(voDir, `full_${voice}.pcm`);
  const wav = join(voDir, `full_${voice}.wav`);
  writeFileSync(raw, Buffer.from(b64, "base64"));
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", raw, wav]);
  rmSync(raw);
  console.log(`${voice}: ${measure(wav).toFixed(1)}s → ${wav}`);
  await new Promise((r) => setTimeout(r, 1500));
}

// default selection: first candidate (override by rerunning with the voice arg)
const chosen = CANDIDATES[0];
film.voFull = `vo/${domain}/full_${chosen}.wav`;
film.voTracks = []; // single continuous track replaces per-scene clips
writeFileSync(join(runDir, "film.json"), JSON.stringify(film, null, 2));
console.log(`film.voFull = ${film.voFull} (rerun with a voice arg to switch)`);
