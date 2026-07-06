import { Easing, interpolate, spring } from "remotion";

// The taste layer. Every scene animates through these — nothing hand-rolls
// its own curves, so the whole video shares one motion personality.

export const EASE_OUT_EXPO = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN_OUT = Easing.bezier(0.83, 0, 0.17, 1);

// Entrance: fast attack, long settle. 0→1.
export const enter = (frame: number, delay = 0, duration = 18) =>
  interpolate(frame - delay, [0, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT_EXPO,
  });

// Exit: exits are ~2x faster than entrances (things leave with urgency).
export const exit = (frame: number, sceneDuration: number, duration = 8) =>
  interpolate(frame, [sceneDuration - duration, sceneDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_IN_OUT,
  });

// Snappy spring — no overshoot. For layout-critical moves.
export const snappy = (frame: number, fps: number, delay = 0) =>
  spring({
    frame,
    fps,
    delay,
    config: { damping: 200, mass: 0.7, stiffness: 160 },
  });

// Pop spring — slight overshoot. For hero moments only.
export const pop = (frame: number, fps: number, delay = 0) =>
  spring({
    frame,
    fps,
    delay,
    config: { damping: 14, mass: 0.9, stiffness: 130 },
  });

// Incoming punch: every scene starts 5% zoomed and settles. Cuts read as beats.
export const punchIn = (frame: number) =>
  interpolate(frame, [0, 14], [1.05, 1], {
    extrapolateRight: "clamp",
    easing: EASE_OUT_EXPO,
  });

// Slow camera drift across a scene — keeps long holds alive.
export const drift = (frame: number, sceneDuration: number, amount = 0.04) =>
  interpolate(frame, [0, sceneDuration], [1, 1 + amount], {
    easing: Easing.linear,
  });
