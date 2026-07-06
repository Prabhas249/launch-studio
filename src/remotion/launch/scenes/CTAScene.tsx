import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { Brand } from "../schema";
import { BODY, DISPLAY } from "../fonts";
import { pop, snappy } from "../motion";
import { FRAMES_PER_BEAT } from "../beat";
import { Grain, Vignette } from "../fx";

// End card: background flips to accent, name pops, domain pill, ring pulse.
export const CTAScene: React.FC<{
  brand: Brand;
  cta: string;
  duration: number;
}> = ({ brand, cta, duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const nameIn = pop(frame, fps, 2);
  const ctaIn = snappy(frame, fps, 10);
  const pillIn = snappy(frame, fps, 16);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: brand.colors.accent,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* One ring fired per beat, expanding and fading */}
      {Array.from({ length: Math.ceil(duration / FRAMES_PER_BEAT) }).map(
        (_, i) => {
          const birth = i * FRAMES_PER_BEAT;
          const age = frame - birth;
          if (age < 0) return null;
          const scale = interpolate(age, [0, 60], [0.55, 2.4], {
            extrapolateRight: "clamp",
          });
          const fade = interpolate(age, [0, 55], [0.45, 0], {
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                width: 700,
                height: 700,
                borderRadius: "50%",
                border: `3px solid ${brand.colors.background}`,
                opacity: fade,
                transform: `scale(${scale})`,
              }}
            />
          );
        },
      )}
      <div
        style={{
          fontFamily: DISPLAY,
          fontWeight: 800,
          fontSize: 140,
          letterSpacing: "-0.035em",
          color: brand.colors.background,
          opacity: nameIn,
          transform: `scale(${0.85 + nameIn * 0.15})`,
        }}
      >
        {brand.name}
      </div>
      <div
        style={{
          fontFamily: BODY,
          fontWeight: 500,
          fontSize: 40,
          color: brand.colors.background,
          opacity: ctaIn * 0.9,
          transform: `translateY(${(1 - ctaIn) * 26}px)`,
          marginTop: 18,
        }}
      >
        {cta}
      </div>
      <div
        style={{
          marginTop: 54,
          padding: "16px 44px",
          borderRadius: 999,
          backgroundColor: brand.colors.background,
          fontFamily: BODY,
          fontWeight: 600,
          fontSize: 32,
          color: brand.colors.accent === "#FFFFFF" ? "#000" : brand.colors.foreground,
          opacity: pillIn,
          transform: `translateY(${(1 - pillIn) * 24}px)`,
        }}
      >
        {brand.domain}
      </div>
      <Vignette strength={0.35} />
      <Grain opacity={0.08} />
    </AbsoluteFill>
  );
};
