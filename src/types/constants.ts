import {
  LaunchVideoSchema,
  defaultLaunchProps,
} from "../remotion/launch/schema";
import { FPS } from "../remotion/launch/beat";

export const COMP_NAME = "LaunchVideo";

export const CompositionProps = LaunchVideoSchema;
export const defaultMyCompProps = defaultLaunchProps;

export const VIDEO_WIDTH = 1920;
export const VIDEO_HEIGHT = 1080;
export const VIDEO_FPS = FPS;
