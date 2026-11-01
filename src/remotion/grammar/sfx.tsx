import React, { createContext, useContext } from "react";
import { Audio } from "remotion";

export const SfxOn = createContext(true);

/** Scene/cut SFX. Honors film.sfx. Never loops. */
export const Sfx: React.FC<React.ComponentProps<typeof Audio>> = (props) => {
  const on = useContext(SfxOn);
  if (!on) return null;
  return <Audio {...props} loop={false} />;
};
