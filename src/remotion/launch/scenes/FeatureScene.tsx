import React from "react";
import { AbsoluteFill, Series, useCurrentFrame, useVideoConfig } from "remotion";
import type { Brand, Script } from "../schema";
import { BODY, DISPLAY } from "../fonts";
import { drift, punchIn, snappy } from "../motion";
import { SCENE_BARS, bars } from "../beat";

// One feature per bar-and-a-half, full screen, cut on the beat.
export const FeatureScene: React.FC<{
  brand: Brand;
  features: Script["features"];
}> = ({ brand, features }) => {
  return (
    <Series>
      {features.map((feature, i) => (
        <Series.Sequence
          key={i}
          durationInFrames={bars(SCENE_BARS.featureEach)}
        >
          <FeatureCard
            brand={brand}
            index={i}
            total={features.length}
            title={feature.title}
            detail={feature.detail}
            duration={bars(SCENE_BARS.featureEach)}
          />
        </Series.Sequence>
      ))}
    </Series>
  );
};

const FeatureCard: React.FC<{
  brand: Brand;
  index: number;
  total: number;
  title: string;
  detail: string;
  duration: number;
}> = ({ brand, index, total, title, detail, duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const numberIn = snappy(frame, fps, 0);
  const titleIn = snappy(frame, fps, 3);
  const detailIn = snappy(frame, fps, 8);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: brand.colors.background,
        justifyContent: "center",
        transform: `scale(${punchIn(frame) * drift(frame, duration, 0.03)})`,
      }}
    >
      <div style={{ padding: "0 160px" }}>
        <div
          style={{
            fontFamily: BODY,
            fontWeight: 600,
            fontSize: 26,
            letterSpacing: "0.22em",
            color: brand.colors.accent,
            marginBottom: 36,
            opacity: numberIn,
            transform: `translateX(${(1 - numberIn) * -20}px)`,
          }}
        >
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </div>
        <div
          style={{
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: 116,
            letterSpacing: "-0.03em",
            lineHeight: 1.02,
            color: brand.colors.foreground,
            marginBottom: 32,
            opacity: titleIn,
            transform: `translateY(${(1 - titleIn) * 56}px)`,
            filter: `blur(${(1 - titleIn) * 6}px)`,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: BODY,
            fontWeight: 400,
            fontSize: 42,
            lineHeight: 1.35,
            color: brand.colors.muted,
            maxWidth: 1100,
            opacity: detailIn,
            transform: `translateY(${(1 - detailIn) * 30}px)`,
          }}
        >
          {detail}
        </div>
      </div>
    </AbsoluteFill>
  );
};
