import { Composition } from "remotion";
import { LaunchVideo, launchVideoDuration } from "./launch/LaunchVideo";
import { LaunchVideoSchema, defaultLaunchProps } from "./launch/schema";
import { FPS } from "./launch/beat";
import { LeadverseFilm, LEADVERSE_DURATION } from "./leadverse/LeadverseFilm";
import { GrammarFilm, filmDuration } from "./grammar/Film";
import { FilmSchema, leadverseFilmJson } from "./grammar/schema";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="GrammarFilm"
        component={GrammarFilm}
        schema={FilmSchema}
        durationInFrames={filmDuration(leadverseFilmJson)}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={leadverseFilmJson}
        calculateMetadata={({ props }) => ({
          durationInFrames: filmDuration(props),
        })}
      />
      <Composition
        id="LeadverseFilm"
        component={LeadverseFilm}
        durationInFrames={LEADVERSE_DURATION}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="LaunchVideo"
        component={LaunchVideo}
        schema={LaunchVideoSchema}
        durationInFrames={launchVideoDuration(defaultLaunchProps)}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={defaultLaunchProps}
        calculateMetadata={({ props }) => ({
          durationInFrames: launchVideoDuration(props),
        })}
      />
    </>
  );
};
