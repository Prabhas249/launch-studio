import React from "react";
import { AbsoluteFill, Audio, Sequence, Series, staticFile } from "remotion";
import type { Film } from "./schema";
import { ARCHETYPE_BARS, STYLE_PACKS } from "./schema";
import { SceneRenderer } from "./scenes";
import { Grain, Vignette } from "../launch/fx";
import { PixelWipe } from "../vault/PixelWipe";

const BAR = 60;

export const filmDuration = (film: Film) =>
  film.scenes.reduce((sum, s) => sum + ARCHETYPE_BARS[s.type] * BAR, 0);

// JSON in → video out. The director LLM emits Film JSON; this renders it.
export const GrammarFilm: React.FC<Film> = (film) => {
  const pack = STYLE_PACKS[film.stylePack ?? "editorial_cream"];
  const brand = { ...film.brand, colors: { ...pack, accent: film.brand.colors.accent } };
  const durations = film.scenes.map((s) => ARCHETYPE_BARS[s.type] * BAR);
  const starts = durations.reduce<number[]>((acc, d, i) => [...acc, (acc[i - 1] ?? 0) + (durations[i - 1] ?? 0)], []);
  const heroIdx = film.scenes.findIndex((s) => s.type === "PRODUCT_HERO");
  const BEDS: Record<string, string> = {
    pulse: "audio/arranged.wav",
    heavy: "audio/arranged-heavy.wav",
    adrenaline: "audio/arranged-adrenaline.wav",
  };
  const bed = film.musicFile ?? BEDS[film.music ?? "pulse"];
  const hasVo = Boolean(film.voFull) || (film.voTracks ?? []).some(Boolean);
  // Sidechain pump: bed ducks hard on every beat and breathes back (ad energy),
  // plus overall duck when a voiceover is present.
  const BEAT = 15;
  const bedVolume = (f: number) => {
    const inBeat = f % BEAT;
    const pump = 0.62 + 0.38 * Math.min(1, inBeat / 9);
    return (hasVo ? 0.5 : 0.9) * pump;
  };

  return (
    <AbsoluteFill style={{ backgroundColor: brand.colors.bg }}>
      <Audio src={staticFile(bed)} volume={bedVolume} />
      {film.voFull ? (
        <Sequence from={10}>
          <Audio src={staticFile(film.voFull)} volume={1} />
        </Sequence>
      ) : (
        (film.voTracks ?? []).map((vo, i) =>
          vo ? (
            <Sequence key={`vo-${i}`} from={starts[i] + 4} durationInFrames={durations[i]}>
              <Audio
                src={staticFile(vo)}
                volume={(f) =>
                  f > durations[i] - 12 ? Math.max(0, (durations[i] - f) / 12) : 1
                }
              />
            </Sequence>
          ) : null,
        )
      )}
      {starts.slice(1).map((cut, i) => (
        <Sequence key={`wh-${i}`} from={cut - 7} durationInFrames={20}>
          <Audio src={staticFile(i % 2 === 0 ? "audio/whoosh.wav" : "audio/whoosh2.wav")} volume={0.5} />
        </Sequence>
      ))}
      {heroIdx >= 0 ? (
        <Sequence from={starts[heroIdx] + BAR - 4} durationInFrames={32}>
          <Audio src={staticFile("audio/impact.wav")} volume={0.85} />
        </Sequence>
      ) : null}

      <Series>
        {film.scenes.map((scene, i) => (
          <Series.Sequence key={i} durationInFrames={durations[i]}>
            <SceneRenderer scene={scene} brand={brand} duration={durations[i]} />
          </Series.Sequence>
        ))}
      </Series>

      {/* pixel-wipe on alternating cuts (variety rule: never the same transition twice in a row) */}
      {starts.slice(1).map((cut, i) =>
        i % 2 === 1 ? (
          <Sequence key={`pw-${i}`} from={cut - 8} durationInFrames={16}>
            <PixelWipe color={brand.colors.fg} accent={brand.colors.accent} />
          </Sequence>
        ) : null,
      )}

      <Vignette strength={0.22} />
      <Grain opacity={0.05} />
    </AbsoluteFill>
  );
};
