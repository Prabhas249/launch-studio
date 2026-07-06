"use client";

import { Player } from "@remotion/player";
import type { NextPage } from "next";
import { LaunchVideo, launchVideoDuration } from "../remotion/launch/LaunchVideo";
import { defaultLaunchProps } from "../remotion/launch/schema";
import { VIDEO_FPS, VIDEO_HEIGHT, VIDEO_WIDTH } from "../types/constants";

const Home: NextPage = () => {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0A0A0C",
        color: "#F5F4F0",
        fontFamily: "Inter, system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "48px 24px",
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>
        Launch Studio
      </h1>
      <p style={{ color: "#8B8B93", marginBottom: 32 }}>
        Paste a URL, get a launch video. (Ingest coming — this is the motion
        engine.)
      </p>
      <div
        style={{
          width: "100%",
          maxWidth: 1100,
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 40px 120px -20px rgba(0,0,0,0.8)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Player
          component={LaunchVideo}
          inputProps={defaultLaunchProps}
          durationInFrames={launchVideoDuration(defaultLaunchProps)}
          fps={VIDEO_FPS}
          compositionHeight={VIDEO_HEIGHT}
          compositionWidth={VIDEO_WIDTH}
          style={{ width: "100%" }}
          controls
          autoPlay
          loop
          initiallyMuted
        />
      </div>
    </div>
  );
};

export default Home;
