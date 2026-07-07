// BRAIN step 3 — voiceover. Gemini TTS, one clip per scene, ducked under in the mix.
// Usage: node scripts/voiceover.mjs <domain>
// Reads runs/<domain>/film.json → writes public/vo/<domain>/scene_N.wav + updates film.json voTracks
import "dotenv/config";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const domain = process.argv[2];
if (!domain) {
  console.error("usage: node scripts/voiceover.mjs <domain>");
  process.exit(1);
}
const key = process.env.GEMINI_API_KEY;
const TTS_MODEL = process.env.TTS_MODEL ?? "gemini-2.5-flash-preview-tts";
const VOICE = process.env.TTS_VOICE ?? "Fenrir"; // energetic male; try: Puck, Charon, Kore
const runDir = join("runs", domain);
const voDir = join("public", "vo", domain);
mkdirSync(voDir, { recursive: true });
const film = JSON.parse(readFileSync(join(runDir, "film.json"), "utf8"));

// One punchy line per scene, derived from the scene copy (≤ scene length when spoken).
const lineFor = (s) => {
  switch (s.type) {
    case "COLD_OPEN":
      return s.words.map((w) => w.t.replace(/[.!]$/, "")).join(" ") + ".";
    case "PAIN_TYPOGRAPHY":
      return `${s.lines[0]}. ${s.lines[1] ?? ""}`;
    case "PRODUCT_HERO":
      return s.headline.replace("|", "") + " " + s.chip + ".";
    case "FEATURE_WALK":
      return s.steps.map((st) => st.title).join(". ") + ".";
    case "STAT_CALLOUT":
      return `${s.prefix ?? ""}${s.value.toLocaleString("en-US")} ${s.suffix}.`;
    case "CTA_COMPRESSION":
      return `${s.headline.replace(/\n/g, " ")} ${s.domain}. ${s.sub}`;
    default:
      return null;
  }
};

const voTracks = [];
for (let i = 0; i < film.scenes.length; i++) {
  const line = lineFor(film.scenes[i]);
  if (!line) {
    voTracks.push(null);
    continue;
  }
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Say this fast, punchy and confident, like a high-energy startup ad voiceover, no pauses: ${line}`,
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } },
        },
      }),
    },
  );
  if (!res.ok) {
    console.error(`TTS scene ${i}: ${res.status} ${await res.text()}`);
    voTracks.push(null);
    continue;
  }
  const data = await res.json();
  const b64 = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!b64) {
    console.error(`TTS scene ${i}: no audio in response`);
    voTracks.push(null);
    continue;
  }
  const raw = join(voDir, `scene_${i}.pcm`);
  const wav = join(voDir, `scene_${i}.wav`);
  writeFileSync(raw, Buffer.from(b64, "base64"));
  // Gemini TTS returns 24kHz 16-bit mono PCM
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", raw, wav]);
  rmSync(raw);
  voTracks.push(`vo/${domain}/scene_${i}.wav`);
  console.log(`vo scene ${i}: "${line.slice(0, 60)}..."`);
}

film.voTracks = voTracks;
writeFileSync(join(runDir, "film.json"), JSON.stringify(film, null, 2));
console.log(`voiceover done: ${voTracks.filter(Boolean).length}/${film.scenes.length} scenes`);
