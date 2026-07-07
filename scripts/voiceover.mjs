// BRAIN step 3 — voiceover. Situational direction (never emotion tags), Charon voice.
// Voice rules: ~/.claude/skills/launch-video-voice/SKILL.md + docs/FIX_PLAN.md
// Usage: node scripts/voiceover.mjs <domain>
// Reads runs/<domain>/story.json (vo lines) + film.json → writes wavs + voTracks into film.json
import "dotenv/config";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const domain = process.argv[2];
if (!domain) {
  console.error("usage: node scripts/voiceover.mjs <domain>");
  process.exit(1);
}
const key = process.env.GEMINI_API_KEY;
const MODELS = [process.env.TTS_MODEL, "gemini-2.5-flash-preview-tts", "gemini-3.1-flash-tts-preview"].filter(Boolean);
const VOICE = process.env.TTS_VOICE ?? "Charon"; // low-pitched voices resist announcer prosody
const runDir = join("runs", domain);
const voDir = join("public", "vo", domain);
mkdirSync(voDir, { recursive: true });
const film = JSON.parse(readFileSync(join(runDir, "film.json"), "utf8"));
const storyPath = join(runDir, "story.json");
const story = existsSync(storyPath) ? JSON.parse(readFileSync(storyPath, "utf8")) : null;

// Planned scene seconds (beat-locked: bars × 2s)
const PLANNED_S = { COLD_OPEN: 4, PAIN_TYPOGRAPHY: 4, PRODUCT_HERO: 6, FEATURE_WALK: 8, STAT_CALLOUT: 4, CTA_COMPRESSION: 6 };

// The fix: situational scene context, NOT emotion tags. A person, not an announcer.
const AUDIO_PROFILE = `A confident, thoughtful narrator — sounds like a person who genuinely understands what they're describing, not someone reading a script.`;
const SCENE_CONTEXT = {
  COLD_OPEN: {
    situation: `You're describing a problem you personally lived with. Not dramatizing it — just noting the obvious absurdity of how things worked before.`,
    style: `Dry recognition. Like saying "turns out the way everyone was doing this was kind of insane."`,
    pacing: `Unhurried. The tension is in the observation, not the delivery speed.`,
  },
  PAIN_TYPOGRAPHY: {
    situation: `You're recounting the old way for someone who already knows the pain. They already agree. You're just listing it flatly.`,
    style: `Matter-of-fact, slightly tired. Not whiny, not dramatic.`,
    pacing: `Clipped. Short pauses between items. No vocal energy.`,
  },
  PRODUCT_HERO: {
    situation: `You just watched someone try this for the first time. The demo took 30 seconds. They got it. You're telling a colleague about it over coffee. Not performing.`,
    style: `Understated confidence. The product earns the response; you don't manufacture it.`,
    pacing: `Conversational. One short breath before the product name. No pitch rise at end of sentence.`,
  },
  FEATURE_WALK: {
    situation: `You're walking someone through something you've used before. You know where to click. You're describing steps, not performing a demo.`,
    style: `Practical, informative. Narrating a screen recording for a colleague.`,
    pacing: `Even. Brief pause between steps.`,
  },
  STAT_CALLOUT: {
    situation: `You're reporting a fact you are mildly proud of. You have the data. Not selling — citing.`,
    style: `Calm, slight satisfaction — like reporting a fact you are proud of.`,
    pacing: `Slow slightly on the number. Natural pause after it.`,
  },
  CTA_COMPRESSION: {
    situation: `Small demo call with two people, not a stage. You're suggesting something quietly because you're confident it's worth their time.`,
    style: `Soft suggestion, like someone who has already seen how this ends.`,
    pacing: `Slow slightly on the domain name. No urgency.`,
  },
};

// TTS models reject systemInstruction ("Developer instruction is not enabled"),
// so persona + scene + notes + transcript live in ONE structured prompt.
const buildPrompt = (sceneType, transcript) => {
  const s = SCENE_CONTEXT[sceneType] ?? SCENE_CONTEXT.COLD_OPEN;
  return `## AUDIO PROFILE\n${AUDIO_PROFILE}\n\n## THE SCENE\n${s.situation}\n\n### DIRECTOR'S NOTES\nStyle: ${s.style}\nPacing: ${s.pacing}\n\nSpeak ONLY the lines under TRANSCRIPT. Nothing else.\n\n#### TRANSCRIPT\n${transcript}`;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function tts(text, sceneType, sceneIdx) {
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: buildPrompt(sceneType, text) }] }],
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
      if (!res.ok) break;
      const data = await res.json();
      const b64 = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (b64) return b64;
      await sleep(2000);
    }
  }
  console.error(`TTS scene ${sceneIdx}: all attempts failed`);
  return null;
}

const measureWav = (p) =>
  parseFloat(execFileSync("ffprobe", ["-v", "quiet", "-show_entries", "format=duration", "-of", "csv=p=0", p]).toString());

const voTracks = [];
for (let i = 0; i < film.scenes.length; i++) {
  const scene = film.scenes[i];
  // storyteller's line wins; fall back to director's vo
  const storyScene = story?.scenes?.find((s) => s.scene_type === scene.type);
  const line = (storyScene?.vo_line ?? scene.vo ?? "").trim();
  if (!line) {
    voTracks.push(null);
    continue;
  }
  const b64 = await tts(line, scene.type, i);
  if (!b64) {
    voTracks.push(null);
    continue;
  }
  const raw = join(voDir, `scene_${i}.pcm`);
  let wav = join(voDir, `scene_${i}.wav`);
  writeFileSync(raw, Buffer.from(b64, "base64"));
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", raw, wav]);
  rmSync(raw);

  // duration guard: compress up to 15% if the read seriously overruns the beat-locked scene
  const planned = PLANNED_S[scene.type] ?? 6;
  const actual = measureWav(wav);
  if (actual - planned > 0.6) {
    const rate = Math.min(1.15, actual / planned);
    const c = wav.replace(".wav", "_c.wav");
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", wav, "-filter:a", `atempo=${rate.toFixed(3)}`, c]);
    wav = c;
    console.log(`  scene ${i}: ${actual.toFixed(1)}s vs ${planned}s planned → atempo ${rate.toFixed(2)}`);
  }
  voTracks.push(wav.replace(/^public\//, ""));
  console.log(`vo scene ${i} [${VOICE}/${scene.type}]: "${line}"`);
  await sleep(1500);
}

film.voTracks = voTracks;
writeFileSync(join(runDir, "film.json"), JSON.stringify(film, null, 2));
console.log(`voiceover done: ${voTracks.filter(Boolean).length}/${film.scenes.length}, voice=${VOICE}`);
