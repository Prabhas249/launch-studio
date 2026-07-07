import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import type { LaunchVideoProps } from "./schema";
import { SCENE_BARS, bars } from "./beat";

// Sound design, locked to the beat grid:
// - music bed under everything
// - whoosh leading into every scene cut
// - impact when the browser window lands
// - riser through the last 2s before the CTA flip
export const AudioTrack: React.FC<{ props: LaunchVideoProps }> = ({
  props,
}) => {
  const hookEnd = bars(SCENE_BARS.hook);
  const painEnd = hookEnd + bars(SCENE_BARS.pain);
  const revealEnd = painEnd + bars(SCENE_BARS.reveal);
  const featureCuts = props.script.features.map(
    (_, i) => revealEnd + i * bars(SCENE_BARS.featureEach),
  );
  const ctaStart = revealEnd + bars(SCENE_BARS.featureEach) * props.script.features.length;

  // Whoosh peaks ~7 frames in; lead each cut so the peak lands ON the cut.
  const cuts = [hookEnd, painEnd, ...featureCuts, ctaStart];
  const windowLand = painEnd + bars(1) + 8;

  return (
    <>
      <Audio src={staticFile("audio/music/beds/bed.wav")} volume={0.55} />
      {cuts.map((cut, i) => (
        <Sequence key={`whoosh-${i}`} from={cut - 7} durationInFrames={20}>
          <Audio src={staticFile("audio/sfx/transition/whoosh.wav")} volume={0.55} />
        </Sequence>
      ))}
      <Sequence from={windowLand} durationInFrames={32}>
        <Audio src={staticFile("audio/sfx/impact/impact.wav")} volume={0.9} />
      </Sequence>
      <Sequence from={ctaStart - 60} durationInFrames={62}>
        <Audio src={staticFile("audio/sfx/rise/riser.wav")} volume={0.5} />
      </Sequence>
      <Sequence from={ctaStart} durationInFrames={32}>
        <Audio src={staticFile("audio/sfx/impact/impact.wav")} volume={1} />
      </Sequence>
    </>
  );
};
