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
  const ring = interpolate(frame, [8, duration], [0.9, 2.2], {
    extrapolateLeft: "clamp",
  });
  const ringFade = interpolate(frame, [8, duration - 10], [0.5, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: brand.colors.accent,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 700,
          height: 700,
          borderRadius: "50%",
          border: `2px solid ${brand.colors.background}`,
          opacity: ringFade,
          transform: `scale(${ring})`,
        }}
      />
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
    </AbsoluteFill>
  );
};
