import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  Series,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadInterTight } from "@remotion/google-fonts/InterTight";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import type { Film, Scene } from "./schema";
import { SPRING_LOGO, SPRING_SNAPPY } from "../vault/springs";

const TIGHT = loadInterTight("normal", { weights: ["700", "800", "900"] }).fontFamily;
const BODY = loadInter("normal", { weights: ["400", "500", "600"] }).fontFamily;

const BAR = 60;
const BEAT = 15;
type Brand = Film["brand"];

const SNAP = Easing.bezier(0.85, 0, 0.12, 1);
const snapIn = (f: number, start: number, dur = 7) =>
  interpolate(f, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: SNAP,
  });
const explode = (f: number, start: number, dur = 6) =>
  interpolate(f, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
const drift = (f: number, from: number, to: number, len: number) =>
  interpolate(f, [0, len], [from, to], { easing: Easing.linear });

// ————— COLD_OPEN —————
const ColdOpen: React.FC<{ scene: Extract<Scene, { type: "COLD_OPEN" }>; brand: Brand; duration: number }> = ({
  scene,
  brand,
  duration,
}) => {
  const f = useCurrentFrame();
  const words = scene.words.map((w, i) => ({ ...w, at: i >= 3 ? BEAT * (i + 1) : BEAT * i }));
  const current = [...words].reverse().find((w) => f >= w.at) ?? words[0];
  const p = snapIn(f - current.at, 0, 6);
  const boom = explode(f, duration - 8, 8);

  return (
    <AbsoluteFill style={{ backgroundColor: brand.colors.bg, justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          fontFamily: TIGHT,
          fontWeight: 900,
          fontSize: current.t.length > 8 ? 230 : 300,
          letterSpacing: "-0.05em",
          color: current.accent ? brand.colors.accent : brand.colors.fg,
          opacity: boom > 0 ? 1 : p,
          transform: `scale(${(0.92 + p * 0.08) * (1 + boom * 22)}) translateY(${(1 - p) * 20}px)`,
          filter: boom > 0 ? `blur(${boom * 14}px)` : `blur(${(1 - p) * 5}px)`,
        }}
      >
        {current.t}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 120,
          fontFamily: BODY,
          fontWeight: 500,
          fontSize: 30,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: brand.colors.muted,
          opacity: f > BEAT * 3 && f < duration - 10 ? 0.9 : 0,
        }}
      >
        {scene.kicker}
      </div>
    </AbsoluteFill>
  );
};

// ————— PAIN_TYPOGRAPHY (persistent container) —————
const PainTypography: React.FC<{
  scene: Extract<Scene, { type: "PAIN_TYPOGRAPHY" }>;
  brand: Brand;
  duration: number;
}> = ({ scene, brand, duration }) => {
  const f = useCurrentFrame();
  const enter = snapIn(f, 0, 8);
  const per = Math.floor(duration / scene.lines.length);
  const idx = Math.min(Math.floor(f / per), scene.lines.length - 1);
  const swap = snapIn(f - idx * per, 0, 6);
  const out = explode(f, duration - 9, 9);

  return (
    <AbsoluteFill style={{ backgroundColor: brand.colors.bg, justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          position: "absolute",
          top: 90,
          left: 110,
          fontFamily: BODY,
          fontWeight: 600,
          fontSize: 26,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: brand.colors.muted,
          opacity: enter,
        }}
      >
        {scene.label}
      </div>
      <div
        style={{
          width: 780,
          height: 780,
          borderRadius: "50%",
          backgroundColor: brand.colors.accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: 90,
          transform: `scale(${enter * (1 + out * 4)})`,
        }}
      >
        <div
          key={idx}
          style={{
            fontFamily: TIGHT,
            fontWeight: 800,
            fontSize: 64,
            lineHeight: 1.12,
            letterSpacing: "-0.03em",
            color: brand.colors.bg,
            opacity: out > 0 ? 0 : swap,
            transform: `translateY(${(1 - swap) * 26}px)`,
          }}
        >
          {scene.lines[idx]}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ————— PRODUCT_HERO —————
const ProductHero: React.FC<{
  scene: Extract<Scene, { type: "PRODUCT_HERO" }>;
  brand: Brand;
  duration: number;
}> = ({ scene, brand, duration }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const drain = snapIn(f, 0, 10);
  const nameIn = snapIn(f, 4, 8);
  const shrink = interpolate(f, [BAR - 10, BAR + 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: SNAP,
  });
  const windowUp = spring({ frame: f, fps, delay: BAR, config: { damping: 15, mass: 0.8, stiffness: 150 } });
  const push = drift(f, 1, 1.05, duration);
  const chip = spring({ frame: f, fps, delay: BAR * 2, config: SPRING_LOGO });
  const [pre, accentPart] = scene.headline.split("|");

  return (
    <AbsoluteFill style={{ backgroundColor: brand.colors.bg, alignItems: "center", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundColor: brand.colors.accent, transform: `translateY(${-drain * 100}%)` }} />
      <div
        style={{
          position: "absolute",
          top: interpolate(shrink, [0, 1], [400, 78]),
          fontFamily: TIGHT,
          fontWeight: 900,
          fontSize: interpolate(shrink, [0, 1], [190, 64]),
          letterSpacing: "-0.045em",
          color: brand.colors.fg,
          opacity: nameIn,
          transform: `translateY(${(1 - nameIn) * 60}px)`,
          zIndex: 2,
          whiteSpace: "nowrap",
        }}
      >
        {pre}
        {accentPart ? <span style={{ color: brand.colors.accent }}>{accentPart}</span> : null}
      </div>
      <div
        style={{
          position: "absolute",
          top: 210,
          width: 1500,
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 70px 140px -30px rgba(16,16,16,0.55), 0 0 0 1px rgba(16,16,16,0.08)",
          opacity: windowUp > 0.02 ? 1 : 0,
          transform: `translateY(${(1 - windowUp) * 620}px) rotateX(${(1 - windowUp) * 9}deg) scale(${push})`,
          transformOrigin: "50% 10%",
          zIndex: 1,
        }}
      >
        <Img src={staticFile(scene.screenshot)} style={{ width: "100%", display: "block" }} />
      </div>
      <div
        style={{
          position: "absolute",
          top: 168,
          right: 210,
          padding: "16px 30px",
          borderRadius: 999,
          backgroundColor: brand.colors.fg,
          color: brand.colors.bg,
          fontFamily: BODY,
          fontWeight: 600,
          fontSize: 27,
          zIndex: 3,
          opacity: chip,
          transform: `scale(${0.7 + chip * 0.3}) rotate(-3deg)`,
          boxShadow: "0 24px 50px -12px rgba(16,16,16,0.5)",
        }}
      >
        {scene.chip}
      </div>
    </AbsoluteFill>
  );
};

// ————— FEATURE_WALK —————
const FeatureStep: React.FC<{
  step: { screenshot: string; title: string };
  n: string;
  brand: Brand;
  len: number;
  flip: boolean;
}> = ({ step, n, brand, len, flip }) => {
  const f = useCurrentFrame();
  const inP = snapIn(f, 0, 8);
  const dr = drift(f, 0, -26, len);
  const clickAt = Math.round(len * 0.55);
  const ripple = interpolate(f, [clickAt, clickAt + 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const bump = 1 + interpolate(f, [clickAt, clickAt + 3, clickAt + 9], [0, 0.012, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: brand.colors.bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          top: 150,
          left: flip ? 100 : 480,
          width: 1340,
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 60px 120px -28px rgba(16,16,16,0.5), 0 0 0 1px rgba(16,16,16,0.08)",
          transform: `translateX(${(1 - inP) * (flip ? -900 : 900)}px) translateY(${dr}px) scale(${bump})`,
        }}
      >
        <Img src={staticFile(step.screenshot)} style={{ width: "100%", display: "block" }} />
        <div style={{ position: "absolute", left: 640, top: 620, zIndex: 2 }}>
          <div style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: brand.colors.accent, boxShadow: "0 4px 14px rgba(0,0,0,0.45)" }} />
          <div
            style={{
              position: "absolute",
              left: -54,
              top: -54,
              width: 130,
              height: 130,
              borderRadius: "50%",
              border: `4px solid ${brand.colors.accent}`,
              opacity: ripple > 0 ? 1 - ripple : 0,
              transform: `scale(${0.2 + ripple})`,
            }}
          />
        </div>
      </div>
      <div style={{ position: "absolute", left: flip ? 1520 : 110, top: 400, width: 330, transform: `translateY(${(1 - inP) * 60}px)`, opacity: inP }}>
        <div style={{ fontFamily: TIGHT, fontWeight: 900, fontSize: 130, color: brand.colors.accent, letterSpacing: "-0.04em", lineHeight: 1 }}>{n}</div>
        <div style={{ fontFamily: TIGHT, fontWeight: 800, fontSize: 46, color: brand.colors.fg, letterSpacing: "-0.02em", lineHeight: 1.12, marginTop: 18 }}>{step.title}</div>
      </div>
    </AbsoluteFill>
  );
};

const FeatureWalk: React.FC<{
  scene: Extract<Scene, { type: "FEATURE_WALK" }>;
  brand: Brand;
  duration: number;
}> = ({ scene, brand, duration }) => {
  const per = Math.floor(duration / scene.steps.length);
  return (
    <Series>
      {scene.steps.map((step, i) => (
        <Series.Sequence key={i} durationInFrames={i === scene.steps.length - 1 ? duration - per * (scene.steps.length - 1) : per}>
          <FeatureStep step={step} n={String(i + 1).padStart(2, "0")} brand={brand} len={per} flip={i % 2 === 1} />
        </Series.Sequence>
      ))}
    </Series>
  );
};

// ————— STAT_CALLOUT —————
const StatCallout: React.FC<{
  scene: Extract<Scene, { type: "STAT_CALLOUT" }>;
  brand: Brand;
  duration: number;
}> = ({ scene, brand, duration }) => {
  const f = useCurrentFrame();
  const n = Math.round(
    interpolate(f, [4, duration * 0.7], [0, scene.value], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.exp),
    }),
  );
  const inP = snapIn(f, 0, 8);
  return (
    <AbsoluteFill style={{ backgroundColor: brand.colors.fg, justifyContent: "center", alignItems: "center" }}>
      <div style={{ fontFamily: TIGHT, fontWeight: 900, fontSize: 330, letterSpacing: "-0.05em", color: brand.colors.accent, lineHeight: 1, opacity: inP, fontVariantNumeric: "tabular-nums" }}>
        {n.toLocaleString("en-US")}
      </div>
      <div style={{ fontFamily: BODY, fontWeight: 500, fontSize: 40, color: brand.colors.bg, marginTop: 26, opacity: inP * 0.92 }}>
        {scene.suffix}
      </div>
    </AbsoluteFill>
  );
};

// ————— CTA_COMPRESSION —————
const CtaCompression: React.FC<{
  scene: Extract<Scene, { type: "CTA_COMPRESSION" }>;
  brand: Brand;
  duration: number;
}> = ({ scene, brand, duration }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const flood = snapIn(f, 0, 9);
  const inP = snapIn(f, 6, 8);
  const pill = spring({ frame: f, fps, delay: 14, config: SPRING_SNAPPY });
  const endBit = snapIn(f, duration - 40, 8);
  return (
    <AbsoluteFill style={{ backgroundColor: brand.colors.fg, justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
      <div style={{ position: "absolute", width: 2400, height: 2400, borderRadius: "50%", backgroundColor: brand.colors.accent, transform: `scale(${flood})` }} />
      {Array.from({ length: Math.ceil(duration / BEAT) }).map((_, i) => {
        const age = f - (i * BEAT + 10);
        if (age < 0) return null;
        const s = interpolate(age, [0, 55], [0.5, 2.3], { extrapolateRight: "clamp" });
        const o = interpolate(age, [0, 50], [0.35, 0], { extrapolateRight: "clamp" });
        return <div key={i} style={{ position: "absolute", width: 760, height: 760, borderRadius: "50%", border: `3px solid ${brand.colors.bg}`, opacity: o, transform: `scale(${s})` }} />;
      })}
      <div style={{ textAlign: "center", zIndex: 1 }}>
        <div style={{ fontFamily: TIGHT, fontWeight: 900, fontSize: 108, letterSpacing: "-0.04em", lineHeight: 1.02, color: brand.colors.fg, opacity: inP, transform: `translateY(${(1 - inP) * 40}px)`, whiteSpace: "pre-line" }}>
          {scene.headline}
        </div>
        <div style={{ display: "inline-block", marginTop: 54, padding: "20px 52px", borderRadius: 999, backgroundColor: brand.colors.fg, color: brand.colors.bg, fontFamily: BODY, fontWeight: 600, fontSize: 38, opacity: Math.min(pill, 1), transform: `translateY(${(1 - Math.min(pill, 1)) * 26}px)` }}>
          {scene.domain}
        </div>
        <div style={{ marginTop: 34, fontFamily: BODY, fontWeight: 500, fontSize: 27, color: brand.colors.fg, opacity: endBit * 0.85 }}>
          {scene.sub}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ————— Router —————
export const SceneRenderer: React.FC<{ scene: Scene; brand: Brand; duration: number }> = ({ scene, brand, duration }) => {
  switch (scene.type) {
    case "COLD_OPEN":
      return <ColdOpen scene={scene} brand={brand} duration={duration} />;
    case "PAIN_TYPOGRAPHY":
      return <PainTypography scene={scene} brand={brand} duration={duration} />;
    case "PRODUCT_HERO":
      return <ProductHero scene={scene} brand={brand} duration={duration} />;
    case "FEATURE_WALK":
      return <FeatureWalk scene={scene} brand={brand} duration={duration} />;
    case "STAT_CALLOUT":
      return <StatCallout scene={scene} brand={brand} duration={duration} />;
    case "CTA_COMPRESSION":
      return <CtaCompression scene={scene} brand={brand} duration={duration} />;
  }
};
