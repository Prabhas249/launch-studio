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
import { Grain, GridDots, GlowOrb, LightSweep, Vignette } from "../fx";

// "Meet {name}" → the product rises in a 3D-tilted browser window, camera
// pushes in, UI chips float out of the screen with their own physics.
export const RevealScene: React.FC<{
  brand: Brand;
  reveal: string;
  duration: number;
}> = ({ brand, reveal, duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn = snappy(frame, fps, 2);
  const windowIn = pop(frame, fps, bars(1) - 6);
  const push = interpolate(frame, [bars(2), duration], [1, 1.12], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_IN_OUT,
  });
  const pan = interpolate(frame, [bars(1), duration], [0, -70], {
    extrapolateLeft: "clamp",
    easing: EASE_IN_OUT,
  });
  const titleShrink = interpolate(frame, [bars(1) - 8, bars(1) + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_IN_OUT,
  });
  // Window starts tilted back, settles to a slight resting tilt.
  const tilt = interpolate(windowIn, [0, 1], [16, 3.5]);

  const chips: Array<{
    label: string;
    x: number;
    y: number;
    delay: number;
    mono?: boolean;
  }> = [
    { label: "cubic-bezier(0.16, 1, 0.3, 1)", x: 1310, y: 320, delay: 0, mono: true },
    { label: "60fps · real frame timing", x: 130, y: 640, delay: 8 },
    { label: "blueprint.json ✓", x: 1360, y: 760, delay: 16, mono: true },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: brand.colors.background }}>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          transform: `scale(${punchIn(frame)})`,
          overflow: "hidden",
        }}
      >
        <GlowOrb
          color={brand.colors.accent}
          x="50%"
          y="60%"
          size={1500}
          opacity={0.24}
        />
        <GridDots color={brand.colors.foreground} opacity={0.05} />

        <div
          style={{
            position: "absolute",
            top: interpolate(titleShrink, [0, 1], [452, 84]),
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: interpolate(titleShrink, [0, 1], [120, 52]),
            letterSpacing: "-0.03em",
            color: brand.colors.foreground,
            opacity: titleIn,
            transform: `translateY(${(1 - titleIn) * 50}px)`,
            filter: `blur(${(1 - titleIn) * 8}px)`,
            zIndex: 2,
          }}
        >
          {reveal}
        </div>

        {/* 3D stage */}
        <div style={{ perspective: 1500, position: "absolute", top: 200 }}>
          <div
            style={{
              width: 1380,
              height: 800,
              borderRadius: 18,
              overflow: "hidden",
              backgroundColor: "#111116",
              border: `1px solid ${brand.colors.foreground}1e`,
              boxShadow: `0 80px 160px -30px #000000e6, 0 0 90px ${brand.colors.accent}22, 0 0 0 1px #ffffff08`,
              opacity: windowIn,
              transform: `translateY(${(1 - windowIn) * 380}px) rotateX(${tilt}deg) scale(${push})`,
              transformOrigin: "50% 20%",
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
                style={{ width: "100%", transform: `translateY(${pan}px)` }}
              />
            ) : (
              <UISkeleton brand={brand} pan={pan} frame={frame} fps={fps} />
            )}
          </div>
        </div>

        {/* Floating chips that pop out of the screen */}
        {chips.map((chip, i) => {
          const p = pop(frame, fps, bars(2) + chip.delay);
          const float = Math.sin((frame + i * 40) / 19) * 7;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: chip.x,
                top: chip.y + float,
                padding: "14px 24px",
                borderRadius: 12,
                backgroundColor: "#1a1a21f2",
                border: `1px solid ${brand.colors.accent}55`,
                boxShadow: `0 30px 60px -10px #000000cc, 0 0 30px ${brand.colors.accent}30`,
                fontFamily: chip.mono ? "Menlo, monospace" : BODY,
                fontWeight: 500,
                fontSize: 24,
                color: brand.colors.foreground,
                opacity: p,
                transform: `scale(${0.7 + p * 0.3}) translateY(${(1 - p) * 40}px)`,
                zIndex: 3,
              }}
            >
              {chip.label}
            </div>
          );
        })}
      </AbsoluteFill>
      <LightSweep start={bars(2)} opacity={0.1} />
      <Vignette strength={0.6} />
      <Grain />
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
              backgroundColor:
                i === 0 ? `${brand.colors.accent}2e` : "#ffffff08",
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
