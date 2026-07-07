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
  const bed = film.music === "heavy" ? "audio/arranged-heavy.wav" : "audio/arranged.wav";

  return (
    <AbsoluteFill style={{ backgroundColor: brand.colors.bg }}>
      <Audio src={staticFile(bed)} volume={0.9} />
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
