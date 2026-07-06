import { loadFont as loadBricolage } from "@remotion/google-fonts/BricolageGrotesque";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const bricolage = loadBricolage("normal", { weights: ["700", "800"] });
const inter = loadInter("normal", { weights: ["400", "500", "600"] });

export const DISPLAY = bricolage.fontFamily;
export const BODY = inter.fontFamily;
