import { z } from "zod";

export const BrandSchema = z.object({
  name: z.string(),
  domain: z.string(),
  tagline: z.string(),
  logoUrl: z.string().nullable(),
  screenshotUrl: z.string().nullable(),
  colors: z.object({
    background: z.string(),
    foreground: z.string(),
    accent: z.string(),
    muted: z.string(),
  }),
});

export const ScriptSchema = z.object({
  // "|" splits lines; the last line is rendered in the accent color
  hook: z.string(),
  pain: z.array(z.string()).min(1).max(3),
  reveal: z.string(),
  features: z
    .array(z.object({ title: z.string(), detail: z.string() }))
    .min(1)
    .max(3),
  cta: z.string(),
});

export const LaunchVideoSchema = z.object({
  brand: BrandSchema,
  script: ScriptSchema,
});

export type Brand = z.infer<typeof BrandSchema>;
export type Script = z.infer<typeof ScriptSchema>;
export type LaunchVideoProps = z.infer<typeof LaunchVideoSchema>;

export const defaultLaunchProps: LaunchVideoProps = {
  brand: {
    name: "MotionLens",
    domain: "motionlens.dev",
    tagline: "Turn any UI animation into an AI-ready Motion Blueprint",
    logoUrl: null,
    screenshotUrl: null,
    colors: {
      background: "#0A0A0C",
      foreground: "#F5F4F0",
      accent: "#4D7CFE",
      muted: "#8B8B93",
    },
  },
  script: {
    hook: "Your product moves.|Your AI can't see it.",
    pain: [
      "Screen recordings your agent can't parse",
      "Animation specs written by hand",
      "Guessing easing curves at 2AM",
    ],
    reveal: "Meet MotionLens",
    features: [
      {
        title: "Paste any URL",
        detail: "A serverless recorder captures real frame timing",
      },
      {
        title: "Motion Blueprint",
        detail: "Easing, duration, choreography — as structured data",
      },
      {
        title: "MCP built in",
        detail: "Your coding agent reads motion like code",
      },
    ],
    cta: "Ship motion your AI understands",
  },
};
