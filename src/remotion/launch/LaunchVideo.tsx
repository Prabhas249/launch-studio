import React from "react";
import { AbsoluteFill, Series } from "remotion";
import type { LaunchVideoProps } from "./schema";
import { SCENE_BARS, bars } from "./beat";
import { HookScene } from "./scenes/HookScene";
import { PainScene } from "./scenes/PainScene";
import { RevealScene } from "./scenes/RevealScene";
import { FeatureScene } from "./scenes/FeatureScene";
import { CTAScene } from "./scenes/CTAScene";

export const launchVideoDuration = (props: LaunchVideoProps) =>
  bars(SCENE_BARS.hook) +
  bars(SCENE_BARS.pain) +
  bars(SCENE_BARS.reveal) +
  bars(SCENE_BARS.featureEach) * props.script.features.length +
  bars(SCENE_BARS.cta);

export const LaunchVideo: React.FC<LaunchVideoProps> = ({ brand, script }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: brand.colors.background }}>
      <Series>
        <Series.Sequence durationInFrames={bars(SCENE_BARS.hook)}>
          <HookScene
            brand={brand}
            hook={script.hook}
            duration={bars(SCENE_BARS.hook)}
          />
        </Series.Sequence>
        <Series.Sequence durationInFrames={bars(SCENE_BARS.pain)}>
          <PainScene
            brand={brand}
            pain={script.pain}
            duration={bars(SCENE_BARS.pain)}
          />
        </Series.Sequence>
        <Series.Sequence durationInFrames={bars(SCENE_BARS.reveal)}>
          <RevealScene
            brand={brand}
            reveal={script.reveal}
            duration={bars(SCENE_BARS.reveal)}
          />
        </Series.Sequence>
        <Series.Sequence
          durationInFrames={
            bars(SCENE_BARS.featureEach) * script.features.length
          }
        >
          <FeatureScene brand={brand} features={script.features} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={bars(SCENE_BARS.cta)}>
          <CTAScene
            brand={brand}
            cta={script.cta}
            duration={bars(SCENE_BARS.cta)}
          />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
