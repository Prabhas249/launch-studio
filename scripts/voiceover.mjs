// BRAIN step 3 — voiceover. Gemini TTS with per-scene voice direction.
// Voice rules live in ~/.claude/skills/launch-video-voice/SKILL.md
// Usage: node scripts/voiceover.mjs <domain>
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
const MODELS = [process.env.TTS_MODEL, "gemini-3.1-flash-tts", "gemini-2.5-flash-preview-tts"].filter(Boolean);
const runDir = join("runs", domain);
const voDir = join("public", "vo", domain);
mkdirSync(voDir, { recursive: true });
const film = JSON.parse(readFileSync(join(runDir, "film.json"), "utf8"));

// voice by style pack (see skill: Fenrir rejected; Charon=dark, Puck=cream)
const VOICE = process.env.TTS_VOICE ?? (film.stylePack === "dark_terminal" ? "Charon" : "Puck");

// Per-scene delivery direction (audio profile + scene vibe + director's notes + tags)
const PROFILE =
  "You are the voice of a premium startup launch film — a confident insider telling a friend about something genuinely new.";
const DIRECTION = {
  COLD_OPEN: `[tension] [curiosity] This is the cold open. Low, conspiratorial, fast — pull them in. Land the last word hard.`,
  PAIN_TYPOGRAPHY: `[frustration] This is the old, broken way. Dry, almost tired — not whiny. Clipped delivery.`,
  PRODUCT_HERO: `[excitement] This is the reveal — the lift moment. Pitch up, pace up, smile in the voice.`,
  FEATURE_WALK: `[enthusiasm] Brisk demo energy. Verbs first, no filler, keep it moving.`,
  STAT_CALLOUT: `[determination] Punch the number. Brief pause after it.`,
  CTA_COMPRESSION: `[hope] Warm, confident close. Slow slightly on the domain name.`,
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function tts(text, direction, sceneIdx) {
  const prompt = `${PROFILE} ${direction} Say exactly this, nothing else: ${text}`;
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } },
            },
          }),
        },
      );
      if (res.status === 429) {
        await sleep(8000);
        continue;
      }
      if (!res.ok) break; // try next model
      const data = await res.json();
      const b64 = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (b64) return b64;
      await sleep(2000);
    }
  }
  console.error(`TTS scene ${sceneIdx}: all attempts failed`);
  return null;
}

const voTracks = [];
for (let i = 0; i < film.scenes.length; i++) {
  const scene = film.scenes[i];
  const line = (scene.vo ?? "").trim();
  if (!line) {
    voTracks.push(null);
    console.log(`vo scene ${i}: (no narration written by director)`);
    continue;
  }
  const b64 = await tts(line, DIRECTION[scene.type] ?? "", i);
  if (!b64) {
    voTracks.push(null);
    continue;
  }
  const raw = join(voDir, `scene_${i}.pcm`);
  const wav = join(voDir, `scene_${i}.wav`);
  writeFileSync(raw, Buffer.from(b64, "base64"));
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", raw, wav]);
  rmSync(raw);
  voTracks.push(`vo/${domain}/scene_${i}.wav`);
  console.log(`vo scene ${i} [${VOICE}]: "${line}"`);
  await sleep(1500); // stay under 10 RPM
}

film.voTracks = voTracks;
writeFileSync(join(runDir, "film.json"), JSON.stringify(film, null, 2));
console.log(`voiceover done: ${voTracks.filter(Boolean).length}/${film.scenes.length} scenes, voice=${VOICE}`);
