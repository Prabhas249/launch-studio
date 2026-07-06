import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { Brand } from "../schema";
import { BODY, DISPLAY } from "../fonts";
import { EASE_IN_OUT, pop, punchIn, snappy } from "../motion";
import { bars } from "../beat";

// "Meet {name}" → the product rises in a browser window, camera pushes in,
// screenshot slow-pans. Falls back to a code-rendered UI skeleton when no
// screenshot is provided.
export const RevealScene: React.FC<{
  brand: Brand;
  reveal: string;
  duration: number;
}> = ({ brand, reveal, duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn = snappy(frame, fps, 2);
  const windowIn = pop(frame, fps, bars(1) - 6);
  // Camera push onto the window across the back half of the scene.
  const push = interpolate(frame, [bars(2), duration], [1, 1.13], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_IN_OUT,
  });
  const pan = interpolate(frame, [bars(1), duration], [0, -80], {
    extrapolateLeft: "clamp",
    easing: EASE_IN_OUT,
  });
  const titleShrink = interpolate(frame, [bars(1) - 8, bars(1) + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_IN_OUT,
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: brand.colors.background,
        justifyContent: "center",
        alignItems: "center",
        transform: `scale(${punchIn(frame)})`,
        overflow: "hidden",
      }}
    >
      {/* Accent glow behind the window */}
      <div
        style={{
          position: "absolute",
          width: 1100,
          height: 700,
          borderRadius: "50%",
          background: `radial-gradient(closest-side, ${brand.colors.accent}33, transparent)`,
          opacity: windowIn,
          filter: "blur(40px)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: interpolate(titleShrink, [0, 1], [430, 96]),
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: DISPLAY,
          fontWeight: 800,
          fontSize: interpolate(titleShrink, [0, 1], [120, 56]),
          letterSpacing: "-0.03em",
          color: brand.colors.foreground,
          opacity: titleIn,
          transform: `translateY(${(1 - titleIn) * 50}px)`,
          filter: `blur(${(1 - titleIn) * 8}px)`,
        }}
      >
        {reveal}
      </div>

      <div
        style={{
          position: "absolute",
          top: 220,
          width: 1360,
          height: 860,
          borderRadius: 18,
          overflow: "hidden",
          backgroundColor: "#111116",
          border: `1px solid ${brand.colors.foreground}1e`,
          boxShadow: `0 60px 140px -20px #000000cc, 0 0 0 1px #ffffff08`,
          opacity: windowIn,
          transform: `translateY(${(1 - windowIn) * 340}px) scale(${push})`,
          transformOrigin: "50% 30%",
        }}
      >
        {/* Browser chrome */}
        <div
          style={{
            height: 52,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 20px",
            backgroundColor: "#17171d",
            borderBottom: "1px solid #ffffff0d",
          }}
        >
          {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
            <div
              key={c}
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: c,
              }}
            />
          ))}
          <div
            style={{
              marginLeft: 16,
              padding: "6px 18px",
              borderRadius: 8,
              backgroundColor: "#ffffff0a",
              fontFamily: BODY,
              fontSize: 17,
              color: brand.colors.muted,
            }}
          >
            {brand.domain}
          </div>
        </div>

        {brand.screenshotUrl ? (
          <Img
            src={brand.screenshotUrl}
            style={{
              width: "100%",
              transform: `translateY(${pan}px)`,
            }}
          />
        ) : (
          <UISkeleton brand={brand} pan={pan} frame={frame} fps={fps} />
        )}
      </div>
    </AbsoluteFill>
  );
};

// Fallback product UI drawn in code — crisp at any zoom, no assets needed.
const UISkeleton: React.FC<{
  brand: Brand;
  pan: number;
  frame: number;
  fps: number;
}> = ({ brand, pan, frame, fps }) => {
  return (
    <div
      style={{
        padding: 36,
        display: "flex",
        gap: 28,
        transform: `translateY(${pan * 0.4}px)`,
      }}
    >
      <div style={{ width: 240 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              height: 40,
              borderRadius: 10,
              marginBottom: 12,
              backgroundColor: i === 0 ? `${brand.colors.accent}2e` : "#ffffff08",
              border: i === 0 ? `1px solid ${brand.colors.accent}55` : "none",
              opacity: snappy(frame, fps, bars(1) + i * 3),
            }}
          />
        ))}
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            height: 220,
            borderRadius: 14,
            marginBottom: 24,
            background: `linear-gradient(120deg, ${brand.colors.accent}30, ${brand.colors.accent}08)`,
            border: "1px solid #ffffff10",
            opacity: snappy(frame, fps, bars(1) + 4),
          }}
        />
        <div style={{ display: "flex", gap: 24 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 320,
                borderRadius: 14,
                backgroundColor: "#ffffff07",
                border: "1px solid #ffffff0c",
                opacity: snappy(frame, fps, bars(1) + 8 + i * 4),
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
