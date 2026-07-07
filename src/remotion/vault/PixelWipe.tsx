import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

// Browserbase-style dither/pixel transition: a grid of blocks floods the
// frame in pseudo-random order, then recedes revealing the next scene.
// Place at a cut: from = cut - 8, duration = 16.
const COLS = 24;
const ROWS = 14;
const order = (i: number) => ((i * 2654435761) % 4294967296) / 4294967296; // deterministic hash

export const PixelWipe: React.FC<{ color: string; accent: string }> = ({ color, accent }) => {
  const f = useCurrentFrame(); // 0..16, cut at 8
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: COLS * ROWS }).map((_, i) => {
        const r = order(i);
        const inAt = r * 6; // covers 0..6
        const outAt = 8 + r * 6; // uncovers 8..14
        const covered = interpolate(f, [inAt, inAt + 2], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const uncovered = interpolate(f, [outAt, outAt + 2], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const on = covered * (1 - uncovered);
        if (on <= 0) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${((i % COLS) / COLS) * 100}%`,
              top: `${(Math.floor(i / COLS) / ROWS) * 100}%`,
              width: `${100 / COLS + 0.1}%`,
              height: `${100 / ROWS + 0.1}%`,
              backgroundColor: r > 0.92 ? accent : color,
              opacity: on,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
