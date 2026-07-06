import { Composition } from "remotion";
import { LaunchVideo, launchVideoDuration } from "./launch/LaunchVideo";
import { LaunchVideoSchema, defaultLaunchProps } from "./launch/schema";
import { FPS } from "./launch/beat";

export const RemotionRoot: React.FC = () => {
  return (
    <>
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
