import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { Brand } from "../schema";
import { DISPLAY } from "../fonts";
import { drift, punchIn, snappy } from "../motion";

// Cold open: the hook statement lands word by word.
// "|" splits lines; the final line renders in the accent color.
export const HookScene: React.FC<{
  brand: Brand;
  hook: string;
  duration: number;
}> = ({ brand, hook, duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const lines = hook.split("|").map((l) => l.trim());
  let wordIndex = 0;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: brand.colors.background,
        justifyContent: "center",
        alignItems: "center",
        transform: `scale(${punchIn(frame) * drift(frame, duration)})`,
      }}
    >
      <div style={{ padding: "0 120px", textAlign: "center" }}>
        {lines.map((line, li) => {
          const isAccent = li === lines.length - 1 && lines.length > 1;
          return (
            <div
              key={li}
              style={{
                fontFamily: DISPLAY,
                fontWeight: 800,
                fontSize: 108,
                lineHeight: 1.08,
                letterSpacing: "-0.03em",
                color: isAccent ? brand.colors.accent : brand.colors.foreground,
              }}
            >
              {line.split(" ").map((word, wi) => {
                const delay = 4 + wordIndex * 3;
                wordIndex += 1;
                const p = snappy(frame, fps, delay);
                return (
                  <span
                    key={wi}
                    style={{
                      display: "inline-block",
                      marginRight: "0.26em",
                      opacity: p,
                      transform: `translateY(${(1 - p) * 46}px)`,
                      filter: `blur(${(1 - p) * 7}px)`,
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
