import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { EASE_IN_OUT } from "./motion";

// Film-texture layer: grain, vignette, dot grid, glow orbs, light sweeps.
// These sit on top of / behind every scene and kill the "flat div" look.

const GRAIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" filter="url(%23n)" opacity="0.6"/></svg>`;
const GRAIN_URI = `url("data:image/svg+xml,${GRAIN_SVG}")`;

// Animated film grain — jitters position every other frame.
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.06 }) => {
  const frame = useCurrentFrame();
  const jitter = (frame % 4) * 37;
  return (
    <AbsoluteFill
      style={{
        backgroundImage: GRAIN_URI,
        backgroundPosition: `${jitter}px ${-jitter}px`,
        opacity,
        mixBlendMode: "overlay",
        pointerEvents: "none",
      }}
    />
  );
};

export const Vignette: React.FC<{ strength?: number }> = ({
  strength = 0.5,
}) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,${strength}) 100%)`,
      pointerEvents: "none",
    }}
  />
);

// Faint dot-matrix — gives the black canvas a surface.
export const GridDots: React.FC<{ color: string; opacity?: number }> = ({
  color,
  opacity = 0.14,
}) => (
  <AbsoluteFill
    style={{
      backgroundImage: `radial-gradient(${color} 1px, transparent 1px)`,
      backgroundSize: "28px 28px",
      opacity,
      maskImage:
        "radial-gradient(ellipse at center, black 30%, transparent 75%)",
      WebkitMaskImage:
        "radial-gradient(ellipse at center, black 30%, transparent 75%)",
    }}
  />
);

// Soft accent orb that breathes with the frame — background depth.
export const GlowOrb: React.FC<{
  color: string;
  x: string;
  y: string;
  size?: number;
  opacity?: number;
}> = ({ color, x, y, size = 900, opacity = 0.22 }) => {
  const frame = useCurrentFrame();
  const breathe = 1 + Math.sin(frame / 22) * 0.06;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        transform: `translate(-50%, -50%) scale(${breathe})`,
        borderRadius: "50%",
        background: `radial-gradient(closest-side, ${color}, transparent 70%)`,
        opacity,
        filter: "blur(30px)",
      }}
    />
  );
};

// A diagonal light band that sweeps across the frame once.
export const LightSweep: React.FC<{
  start: number;
  duration?: number;
  opacity?: number;
}> = ({ start, duration = 34, opacity = 0.1 }) => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [start, start + duration], [-60, 160], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_IN_OUT,
  });
  return (
    <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: "-20%",
          left: `${x}%`,
          width: "18%",
          height: "140%",
          transform: "rotate(14deg)",
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)",
          opacity,
          mixBlendMode: "overlay",
          filter: "blur(6px)",
        }}
      />
    </AbsoluteFill>
  );
};
