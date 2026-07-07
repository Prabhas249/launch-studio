import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadInterTight } from "@remotion/google-fonts/InterTight";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { Grain, Vignette } from "../launch/fx";

const TIGHT = loadInterTight("normal", { weights: ["700", "800", "900"] }).fontFamily;
const BODY = loadInter("normal", { weights: ["400", "500", "600"] }).fontFamily;

// ————— Editorial Cream brand board (Leadverse) —————
const CREAM = "#F4EFE4";
const INK = "#101010";
const GREEN = "#23C45E";
const MUTED = "#8A867A";

const BAR = 60; // 120BPM @ 30fps
const BEAT = 15;
export const LEADVERSE_DURATION = 16 * BAR; // 960

// Violent snap: huge delta, tiny duration.
const SNAP = Easing.bezier(0.85, 0, 0.12, 1);
const snapIn = (f: number, start: number, dur = 7) =>
  interpolate(f, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: SNAP,
  });
// Explosion INTO camera (accelerating).
const explode = (f: number, start: number, dur = 6) =>
  interpolate(f, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
const microDrift = (f: number, from: number, to: number, len: number) =>
  interpolate(f, [0, len], [from, to], { easing: Easing.linear });

// ————— S1 · HOOK: one giant word per beat, "Reddit" explodes through —————
const Hook: React.FC = () => {
  const f = useCurrentFrame();
  // words appear at beats, each replacing the last (hold-then-snap)
  const words: Array<{ t: string; at: number; green?: boolean }> = [
    { t: "Your", at: 0 },
    { t: "next", at: BEAT },
    { t: "customer", at: BEAT * 2 },
    { t: "is asking", at: BEAT * 4 },
    { t: "Reddit", at: BEAT * 6, green: true },
  ];
  const current = [...words].reverse().find((w) => f >= w.at)!;
  const local = f - current.at;
  const p = snapIn(local, 0, 6);
  const boom = explode(f, BAR * 2 - 8, 8); // Reddit blows through the camera

  return (
    <AbsoluteFill style={{ backgroundColor: CREAM, justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          fontFamily: TIGHT,
          fontWeight: 900,
          fontSize: current.t.length > 8 ? 230 : 300,
          letterSpacing: "-0.05em",
          color: current.green ? GREEN : INK,
          opacity: boom > 0 ? 1 : p,
          transform: `scale(${(0.92 + p * 0.08) * (1 + boom * 22)}) translateY(${(1 - p) * 20}px)`,
          filter: boom > 0 ? `blur(${boom * 14}px)` : `blur(${(1 - p) * 5}px)`,
        }}
      >
        {current.t}
      </div>
      {/* tiny context line, appears with "customer" hold */}
      <div
        style={{
          position: "absolute",
          bottom: 120,
          fontFamily: BODY,
          fontWeight: 500,
          fontSize: 30,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: MUTED,
          opacity: f > BEAT * 3 && f < BAR * 2 - 10 ? 0.9 : 0,
        }}
      >
        right now · in a thread you'll never see
      </div>
    </AbsoluteFill>
  );
};

// ————— S2 · PAIN: persistent green circle, lines swap inside —————
const Pain: React.FC = () => {
  const f = useCurrentFrame();
  const enter = snapIn(f, 0, 8);
  const lines = ["Scrolling subreddits for hours", "Cold DMs nobody answers"];
  const idx = Math.min(Math.floor(f / BAR), lines.length - 1);
  const swap = snapIn(f - idx * BAR, 0, 6);
  const out = explode(f, BAR * 2 - 9, 9); // circle swallows the frame → reveal

  return (
    <AbsoluteFill style={{ backgroundColor: CREAM, justifyContent: "center", alignItems: "center" }}>
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
          color: MUTED,
          opacity: enter,
        }}
      >
        The old way
      </div>
      <div
        style={{
          width: 780,
          height: 780,
          borderRadius: "50%",
          backgroundColor: GREEN,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: 90,
          transform: `scale(${enter * (1 + out * 4)})`,
          opacity: 1,
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
            color: CREAM,
            opacity: out > 0 ? 0 : swap,
            transform: `translateY(${(1 - swap) * 26}px)`,
          }}
        >
          {lines[idx]}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ————— S3 · REVEAL: green→cream drain, giant name, window slams up —————
const Reveal: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const drain = snapIn(f, 0, 10); // green fill drains away (we arrive from the circle)
  const nameIn = snapIn(f, 4, 8);
  const shrink = interpolate(f, [BAR - 10, BAR + 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: SNAP,
  });
  const windowUp = spring({ frame: f, fps, delay: BAR, config: { damping: 15, mass: 0.8, stiffness: 150 } });
  const push = microDrift(f, 1, 1.05, BAR * 3);
  const chip = spring({ frame: f, fps, delay: BAR * 2, config: { damping: 13, mass: 0.7, stiffness: 140 } });

  return (
    <AbsoluteFill style={{ backgroundColor: CREAM, alignItems: "center", overflow: "hidden" }}>
      {/* green drains upward like a curtain */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: GREEN,
          transform: `translateY(${-drain * 100}%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: interpolate(shrink, [0, 1], [400, 78]),
          fontFamily: TIGHT,
          fontWeight: 900,
          fontSize: interpolate(shrink, [0, 1], [190, 64]),
          letterSpacing: "-0.045em",
          color: INK,
          opacity: nameIn,
          transform: `translateY(${(1 - nameIn) * 60}px)`,
          zIndex: 2,
          whiteSpace: "nowrap",
        }}
      >
        Meet Lead<span style={{ color: GREEN }}>verse.</span>
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
        <Img src={staticFile("shots/leadverse/leadverse_hero.png")} style={{ width: "100%", display: "block" }} />
      </div>
      <div
        style={{
          position: "absolute",
          top: 168,
          right: 210,
          padding: "16px 30px",
          borderRadius: 999,
          backgroundColor: INK,
          color: CREAM,
          fontFamily: BODY,
          fontWeight: 600,
          fontSize: 27,
          zIndex: 3,
          opacity: chip,
          transform: `scale(${0.7 + chip * 0.3}) rotate(-3deg)`,
          boxShadow: "0 24px 50px -12px rgba(16,16,16,0.5)",
        }}
      >
        on autopilot 🤖
      </div>
    </AbsoluteFill>
  );
};

// ————— S4 · TOUR: three real screens, cursor clicks, numbered labels —————
const TOUR = [
  { shot: "leadverse_s2.png", n: "01", title: "Describe what you offer", cursor: { x: 620, y: 640 } },
  { shot: "leadverse_s3.png", n: "02", title: "AI finds & scores real asks", cursor: { x: 1330, y: 300 } },
  { shot: "leadverse_hero.png", n: "03", title: "Reply while the thread is hot", cursor: { x: 960, y: 700 } },
];
const TourStep: React.FC<{ step: (typeof TOUR)[0]; len: number; flip: boolean }> = ({ step, len, flip }) => {
  const f = useCurrentFrame();
  const inP = snapIn(f, 0, 8);
  const drift = microDrift(f, 0, -26, len);
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
  const cx = interpolate(f, [4, clickAt], [step.cursor.x + 260, step.cursor.x], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad),
  });
  const cy = interpolate(f, [4, clickAt], [step.cursor.y + 160, step.cursor.y], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad),
  });

  return (
    <AbsoluteFill style={{ backgroundColor: CREAM, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          top: 150,
          left: flip ? 100 : 480,
          width: 1340,
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 60px 120px -28px rgba(16,16,16,0.5), 0 0 0 1px rgba(16,16,16,0.08)",
          transform: `translateX(${(1 - inP) * (flip ? -900 : 900)}px) translateY(${drift}px) scale(${bump})`,
        }}
      >
        <Img src={staticFile(`shots/leadverse/${step.shot}`)} style={{ width: "100%", display: "block" }} />
        {/* cursor + click ripple */}
        <div style={{ position: "absolute", left: cx, top: cy, zIndex: 2 }}>
          <div style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: GREEN, boxShadow: "0 4px 14px rgba(0,0,0,0.45), 0 0 0 3px rgba(244,239,228,0.9)" }} />
          <div
            style={{
              position: "absolute",
              left: 11, top: 11,
              width: 130, height: 130,
              marginLeft: -65, marginTop: -65,
              borderRadius: "50%",
              border: `4px solid ${GREEN}`,
              opacity: ripple > 0 ? 1 - ripple : 0,
              transform: `scale(${0.2 + ripple})`,
            }}
          />
        </div>
      </div>
      <div style={{ position: "absolute", left: flip ? 1520 : 110, top: 400, width: 330, transform: `translateY(${(1 - inP) * 60}px)`, opacity: inP }}>
        <div style={{ fontFamily: TIGHT, fontWeight: 900, fontSize: 130, color: GREEN, letterSpacing: "-0.04em", lineHeight: 1 }}>{step.n}</div>
        <div style={{ fontFamily: TIGHT, fontWeight: 800, fontSize: 46, color: INK, letterSpacing: "-0.02em", lineHeight: 1.12, marginTop: 18 }}>{step.title}</div>
      </div>
    </AbsoluteFill>
  );
};

// ————— S5 · STAT: odometer to 6,850 —————
const Stat: React.FC = () => {
  const f = useCurrentFrame();
  const n = Math.round(
    interpolate(f, [4, BAR * 1.4], [0, 6850], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.exp),
    }),
  );
  const inP = snapIn(f, 0, 8);
  return (
    <AbsoluteFill style={{ backgroundColor: INK, justifyContent: "center", alignItems: "center" }}>
      <div style={{ fontFamily: TIGHT, fontWeight: 900, fontSize: 330, letterSpacing: "-0.05em", color: GREEN, lineHeight: 1, opacity: inP, fontVariantNumeric: "tabular-nums" }}>
        {n.toLocaleString("en-US")}
      </div>
      <div style={{ fontFamily: BODY, fontWeight: 500, fontSize: 40, color: CREAM, marginTop: 26, opacity: inP * 0.92 }}>
        businesses already listening
      </div>
    </AbsoluteFill>
  );
};

// ————— S6 · CTA: green floods from center, rings on beats —————
const CTA: React.FC = () => {
  const f = useCurrentFrame();
  const flood = snapIn(f, 0, 9);
  const inP = snapIn(f, 6, 8);
  const pill = snapIn(f, 14, 8);
  const endBit = snapIn(f, BAR * 2 + 20, 8);
  const len = BAR * 3;
  return (
    <AbsoluteFill style={{ backgroundColor: INK, justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
      <div style={{ position: "absolute", width: 2400, height: 2400, borderRadius: "50%", backgroundColor: GREEN, transform: `scale(${flood})` }} />
      {Array.from({ length: Math.ceil(len / BEAT) }).map((_, i) => {
        const age = f - (i * BEAT + 10);
        if (age < 0) return null;
        const s = interpolate(age, [0, 55], [0.5, 2.3], { extrapolateRight: "clamp" });
        const o = interpolate(age, [0, 50], [0.35, 0], { extrapolateRight: "clamp" });
        return <div key={i} style={{ position: "absolute", width: 760, height: 760, borderRadius: "50%", border: `3px solid ${CREAM}`, opacity: o, transform: `scale(${s})` }} />;
      })}
      <div style={{ textAlign: "center", zIndex: 1 }}>
        <div style={{ fontFamily: TIGHT, fontWeight: 900, fontSize: 108, letterSpacing: "-0.04em", lineHeight: 1.02, color: INK, opacity: inP, transform: `translateY(${(1 - inP) * 40}px)` }}>
          Find people looking
          <br />
          for what you offer.
        </div>
        <div style={{ display: "inline-block", marginTop: 54, padding: "20px 52px", borderRadius: 999, backgroundColor: INK, color: CREAM, fontFamily: BODY, fontWeight: 600, fontSize: 38, opacity: pill, transform: `translateY(${(1 - pill) * 26}px)` }}>
          leadverse.ai
        </div>
        <div style={{ marginTop: 34, fontFamily: BODY, fontWeight: 500, fontSize: 27, color: INK, opacity: endBit * 0.85 }}>
          7-day free trial · no charge today
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ————— FILM —————
export const LeadverseFilm: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: CREAM }}>
      <Audio src={staticFile("audio/music/beds/arranged.wav")} volume={0.9} />
      {[BAR * 2, BAR * 4, BAR * 7, BAR * 11, BAR * 13].map((cut, i) => (
        <Sequence key={i} from={cut - 7} durationInFrames={20}>
          <Audio src={staticFile("audio/sfx/transition/whoosh.wav")} volume={0.5} />
        </Sequence>
      ))}
      <Sequence from={BAR * 5 - 4} durationInFrames={32}>
        <Audio src={staticFile("audio/sfx/impact/impact.wav")} volume={0.85} />
      </Sequence>

      <Sequence durationInFrames={BAR * 2}>
        <Hook />
      </Sequence>
      <Sequence from={BAR * 2} durationInFrames={BAR * 2}>
        <Pain />
      </Sequence>
      <Sequence from={BAR * 4} durationInFrames={BAR * 3}>
        <Reveal />
      </Sequence>
      {TOUR.map((step, i) => (
        <Sequence key={step.n} from={BAR * 7 + i * (BAR * 4) / 3} durationInFrames={(BAR * 4) / 3}>
          <TourStep step={step} len={(BAR * 4) / 3} flip={i % 2 === 1} />
        </Sequence>
      ))}
      <Sequence from={BAR * 11} durationInFrames={BAR * 2}>
        <Stat />
      </Sequence>
      <Sequence from={BAR * 13} durationInFrames={BAR * 3}>
        <CTA />
      </Sequence>

      <Vignette strength={0.22} />
      <Grain opacity={0.05} />
    </AbsoluteFill>
  );
};
