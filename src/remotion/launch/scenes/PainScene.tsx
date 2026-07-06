import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { Brand } from "../schema";
import { BODY, DISPLAY } from "../fonts";
import { EASE_OUT_EXPO, drift, punchIn, snappy } from "../motion";
import { FRAMES_PER_BEAT, bars } from "../beat";
import { Grain, GridDots, GlowOrb, Vignette } from "../fx";

// Pain lines stack up one per beat, then all get struck through at once.
export const PainScene: React.FC<{
  brand: Brand;
  pain: string[];
  duration: number;
}> = ({ brand, pain, duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const strikeStart = bars(1) + FRAMES_PER_BEAT;

  return (
    <AbsoluteFill style={{ backgroundColor: brand.colors.background }}>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          transform: `scale(${punchIn(frame) * drift(frame, duration)})`,
        }}
      >
        <GlowOrb
          color={brand.colors.accent}
          x="88%"
          y="-8%"
          size={1100}
          opacity={0.1}
        />
        <GridDots color={brand.colors.foreground} opacity={0.04} />
        <div style={{ padding: "0 160px", zIndex: 1 }}>
        <div
          style={{
            fontFamily: BODY,
            fontWeight: 600,
            fontSize: 26,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: brand.colors.muted,
            marginBottom: 48,
            opacity: snappy(frame, fps, 0),
          }}
        >
          The old way
        </div>
        {pain.map((line, i) => {
          const p = snappy(frame, fps, 6 + i * FRAMES_PER_BEAT);
          const strike = interpolate(
            frame - strikeStart - i * 3,
            [0, 12],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: EASE_OUT_EXPO,
            },
          );
          return (
            <div key={i} style={{ marginBottom: 22 }}>
              <span
                style={{
                  position: "relative",
                  display: "inline-block",
                  fontFamily: DISPLAY,
                  fontWeight: 700,
                  fontSize: 62,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.25,
                  color: brand.colors.foreground,
                  opacity: p * (1 - strike * 0.55),
                  transform: `translateX(${(1 - p) * -36}px)`,
                }}
              >
                {line}
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "54%",
                    height: 6,
                    width: `${strike * 100}%`,
                    backgroundColor: brand.colors.accent,
                    borderRadius: 3,
                  }}
                />
              </span>
            </div>
          );
        })}
        </div>
      </AbsoluteFill>
      <Vignette strength={0.55} />
      <Grain />
    </AbsoluteFill>
  );
};
