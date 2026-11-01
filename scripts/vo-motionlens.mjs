// One-off: continuous Gemini-TTS VO for the MotionLens HyperFrames relaunch (SCRIPT.md v2).
// Reuses the voiceover-full.mjs approach. Usage: node scripts/vo-motionlens.mjs [voice]
import "dotenv/config";
import { execFileSync } from "node:child_process";
import { writeFileSync, rmSync } from "node:fs";

const key = process.env.GEMINI_API_KEY;
const MODELS = ["gemini-2.5-flash-preview-tts", "gemini-3.1-flash-tts-preview"];
const VOICE = process.argv[2] || "Iapetus";
const OUT = "/Users/prabhas/dev/hf-scratch/motionlens-hf/assets/audio/vo.wav";

const SCRIPT = `Your AI agent can build almost anything you describe.

But it can't see motion.

The timing. The easing. The feel between frames. To your agent, that's a blindspot.

So you go back to hand-tuning. Every curve. Every millisecond. Guessing.

MotionLens gives your agent eyes.

Drop in any animation — a screen recording, or a live website. It reads the exact motion: every layer, every trigger, every curve — into one precise Blueprint.

And it lives inside your workflow. One command installs it as an M-C-P server. Cursor. Claude Code. Windsurf.

Now your agent reads motion straight from any clip. No copy-paste.

Then watch it rebuild the animation.

Pixel-perfect. Down to that exact six-hundred-millisecond ease.

Not a guess. The real numbers, every time.

You vibe-code the app. MotionLens handles the motion.

Give your agent eyes. Start free at motionlens dot dev.`;

const PROMPT = `## AUDIO PROFILE
A senior engineer in their mid-30s demoing a tool he quietly loves. Calm, dry, low-mid pitch. Craig Federighi's restraint without the stagecraft. Never selling, never performing.

## HARD RULES
- Economy of words. Silence between sentences is a feature — a short natural pause at each paragraph break.
- NO advertising energy, NO smile-in-the-voice, NO breathiness. Even, natural documentary pace throughout.
- The line "Pixel-perfect." lands understated, almost thrown away.
- Neutral accent, consistent energy start to finish.

Speak ONLY the lines under TRANSCRIPT, as one continuous take.

#### TRANSCRIPT
${SCRIPT}`;

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
    if (!res.ok) {
      console.error(`${model}: ${res.status} ${(await res.text()).slice(0, 160)}`);
      continue;
    }
    const data = await res.json();
    const b64 = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (b64) return b64;
  }
  return null;
}

const b64 = await tts(VOICE);
if (!b64) { console.error("TTS failed — all models"); process.exit(1); }
const raw = "/tmp/ml-vo.pcm";
writeFileSync(raw, Buffer.from(b64, "base64"));
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", raw, OUT]);
rmSync(raw);
const dur = execFileSync("ffprobe", ["-v", "quiet", "-show_entries", "format=duration", "-of", "csv=p=0", OUT]).toString().trim();
console.log(`VO written: ${OUT} — ${parseFloat(dur).toFixed(1)}s, voice=${VOICE}`);
