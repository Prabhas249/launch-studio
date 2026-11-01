import React from "react";
import { AbsoluteFill, Audio, Sequence, Series, interpolate, staticFile } from "remotion";
import type { Film } from "./schema";
import { ARCHETYPE_BARS, STYLE_PACKS } from "./schema";
import { SceneRenderer } from "./scenes";
import { Grain, Vignette } from "../launch/fx";
import { SfxOn } from "./sfx";

const BAR = 60;
const FPS = 30;

export const filmDuration = (film: Film) =>
  film.scenes.reduce((sum, s) => sum + ARCHETYPE_BARS[s.type] * BAR, 0);

/** Frames to wait after a scene starts so picture is readable before VO. */
const VO_IN: Record<string, number> = {
  COLD_OPEN: 8,
  PAIN_TYPOGRAPHY: 8,
  PRODUCT_HERO: 10,
  FEATURE_WALK: 8,
  STAT_CALLOUT: 6,
  CTA_COMPRESSION: 8,
};

export const GrammarFilm: React.FC<Film> = (film) => {
  const pack = STYLE_PACKS[film.stylePack ?? "editorial_cream"];
  const brand = { ...film.brand, colors: { ...pack, accent: film.brand.colors.accent } };
  const durations = film.scenes.map((s) => ARCHETYPE_BARS[s.type] * BAR);
  const starts = durations.reduce<number[]>((acc, d, i) => [...acc, (acc[i - 1] ?? 0) + (durations[i - 1] ?? 0)], []);
  const total = durations.reduce((a, b) => a + b, 0);
  const BEDS: Record<string, string> = {
    pulse: "audio/music/beds/arranged.wav",
    heavy: "audio/music/beds/arranged-heavy.wav",
    adrenaline: "audio/music/beds/arranged-adrenaline.wav",
  };
  const bed = BEDS[film.music ?? "pulse"];
  const tracks = film.voTracks ?? [];
  const durs = film.voDurations ?? [];
  const useSceneVo = tracks.some(Boolean);

  const voWindows = film.scenes.map((scene, i) => {
    const delay = VO_IN[scene.type] ?? 8;
    const from = starts[i] + delay;
    const clipFrames = durs[i] != null ? Math.max(1, Math.round(durs[i]! * FPS)) : durations[i] - delay;
    const until = from + Math.min(clipFrames, Math.max(1, durations[i] - delay));
    return { from, until };
  });

  const bedVolume = (f: number) => {
    const fadeIn = interpolate(f, [0, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const fadeOut = interpolate(f, [total - 24, total], [1, 0.12], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const speaking = voWindows.some((w) => f >= w.from && f < w.until);
    return (speaking ? 0.06 : 0.2) * fadeIn * fadeOut;
  };

  return (
    <SfxOn.Provider value={film.sfx !== false}>
      <AbsoluteFill style={{ backgroundColor: brand.colors.bg }}>
        <Audio src={staticFile(bed)} volume={bedVolume} loop={false} />
        {useSceneVo
          ? tracks.map((vo, i) => {
              if (!vo) return null;
              const delay = VO_IN[film.scenes[i]?.type] ?? 8;
              const maxFrames = Math.max(1, durations[i] - delay);
              const clipFrames = durs[i] != null ? Math.max(1, Math.round(durs[i]! * FPS)) : maxFrames;
              const hold = Math.min(clipFrames, maxFrames);
              return (
                <Sequence key={`vo-${i}`} from={starts[i] + delay} durationInFrames={hold} layout="none">
                  <Audio src={staticFile(vo)} volume={1} loop={false} />
                </Sequence>
              );
            })
          : film.voFull
            ? (
              <Sequence from={VO_IN.COLD_OPEN} layout="none">
                <Audio src={staticFile(film.voFull)} volume={1} loop={false} />
              </Sequence>
            )
            : null}

        <Series>
          {film.scenes.map((scene, i) => (
            <Series.Sequence key={i} durationInFrames={durations[i]}>
              <SceneRenderer scene={scene} brand={brand} duration={durations[i]} />
            </Series.Sequence>
          ))}
        </Series>

        <Vignette strength={0.1} />
        <Grain opacity={0.04} />
      </AbsoluteFill>
    </SfxOn.Provider>
  );
};
