import { z } from "zod";

// The director contract: the LLM emits THIS. It never writes animation code.
// 6 archetypes v1 (research: ship 6 perfect, keep the rest as stubs later).

export const GrammarBrand = z.object({
  name: z.string(),
  domain: z.string(),
  colors: z.object({
    bg: z.string(), // canvas (e.g. editorial cream)
    fg: z.string(), // ink
    accent: z.string(),
    muted: z.string(),
  }),
});

const ColdOpen = z.object({
  type: z.literal("COLD_OPEN"),
  // one word/phrase per beat; last accent word explodes through camera
  words: z.array(z.object({ t: z.string(), accent: z.boolean() })).min(2).max(6),
  kicker: z.string().describe("tiny uppercase context line"),
});

const PainTypography = z.object({
  type: z.literal("PAIN_TYPOGRAPHY"),
  label: z.string(),
  lines: z.array(z.string()).min(2).max(3),
});

const ProductHero = z.object({
  type: z.literal("PRODUCT_HERO"),
  headline: z.string().describe('e.g. "Meet Leadverse." — accent goes on the substring after |'),
  screenshot: z.string().describe("staticFile path"),
  chip: z.string(),
});

const FeatureWalk = z.object({
  type: z.literal("FEATURE_WALK"),
  steps: z
    .array(z.object({ screenshot: z.string(), title: z.string() }))
    .min(2)
    .max(3),
});

const StatCallout = z.object({
  type: z.literal("STAT_CALLOUT"),
  value: z.number().describe("REAL number from the site — never invented"),
  suffix: z.string().describe('e.g. "businesses already listening"'),
});

const CtaCompression = z.object({
  type: z.literal("CTA_COMPRESSION"),
  headline: z.string(),
  domain: z.string(),
  sub: z.string(),
});

export const SceneSchema = z.discriminatedUnion("type", [
  ColdOpen,
  PainTypography,
  ProductHero,
  FeatureWalk,
  StatCallout,
  CtaCompression,
]);

// Canonical 16-bar sequence (bars @120BPM): fixed v1 rhythm per archetype.
export const ARCHETYPE_BARS: Record<string, number> = {
  COLD_OPEN: 2,
  PAIN_TYPOGRAPHY: 2,
  PRODUCT_HERO: 3,
  FEATURE_WALK: 4,
  STAT_CALLOUT: 2,
  CTA_COMPRESSION: 3,
};

export const FilmSchema = z.object({
  brand: GrammarBrand,
  scenes: z.array(SceneSchema).min(4).max(8),
});

export type Film = z.infer<typeof FilmSchema>;
export type Scene = z.infer<typeof SceneSchema>;

// Parity test: last night's hand-directed Leadverse film, as grammar JSON.
export const leadverseFilmJson: Film = {
  brand: {
    name: "Leadverse",
    domain: "leadverse.ai",
    colors: { bg: "#F4EFE4", fg: "#101010", accent: "#23C45E", muted: "#8A867A" },
  },
  scenes: [
    {
      type: "COLD_OPEN",
      words: [
        { t: "Your", accent: false },
        { t: "next", accent: false },
        { t: "customer", accent: false },
        { t: "is asking", accent: false },
        { t: "Reddit", accent: true },
      ],
      kicker: "right now · in a thread you'll never see",
    },
    {
      type: "PAIN_TYPOGRAPHY",
      label: "The old way",
      lines: ["Scrolling subreddits for hours", "Cold DMs nobody answers"],
    },
    {
      type: "PRODUCT_HERO",
      headline: "Meet Lead|verse.",
      screenshot: "shots/leadverse/leadverse_hero.png",
      chip: "on autopilot 🤖",
    },
    {
      type: "FEATURE_WALK",
      steps: [
        { screenshot: "shots/leadverse/leadverse_s2.png", title: "Describe what you offer" },
        { screenshot: "shots/leadverse/leadverse_s3.png", title: "AI finds & scores real asks" },
        { screenshot: "shots/leadverse/leadverse_hero.png", title: "Reply while the thread is hot" },
      ],
    },
    { type: "STAT_CALLOUT", value: 6850, suffix: "businesses already listening" },
    {
      type: "CTA_COMPRESSION",
      headline: "Find people looking\nfor what you offer.",
      domain: "leadverse.ai",
      sub: "7-day free trial · no charge today",
    },
  ],
};
