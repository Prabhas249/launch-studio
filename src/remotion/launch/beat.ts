// Everything cuts on a musical grid. 120 BPM, 4/4:
// beat = 15 frames, bar = 60 frames @ 30fps.
export const FPS = 30;
export const BPM = 120;

export const FRAMES_PER_BEAT = Math.round((60 / BPM) * FPS);
export const FRAMES_PER_BAR = FRAMES_PER_BEAT * 4;

export const beats = (n: number) => n * FRAMES_PER_BEAT;
export const bars = (n: number) => n * FRAMES_PER_BAR;

// Scene lengths in bars — the video's rhythm lives here, not in the scenes.
export const SCENE_BARS = {
  hook: 2,
  pain: 2,
  reveal: 4,
  featureEach: 1.5,
  cta: 2,
} as const;
