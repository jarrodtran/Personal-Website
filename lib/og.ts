import { readFileSync } from "node:fs";
import { join } from "node:path";

export { ogColors } from "@/lib/palette";

export const ogSize = { width: 1200, height: 630 } as const;

const fontsRoot = join(process.cwd(), "lib/fonts");

export function loadOgFonts() {
  return [
    {
      name: "Newsreader",
      data: readFileSync(join(fontsRoot, "Newsreader-Regular.ttf")),
      style: "normal" as const,
      weight: 400 as const,
    },
    {
      name: "ArrowFallback",
      data: readFileSync(join(fontsRoot, "ArrowFallback.ttf")),
      style: "normal" as const,
      weight: 400 as const,
    },
    {
      name: "IBM Plex Sans",
      data: readFileSync(join(fontsRoot, "IBMPlexSans-Regular.ttf")),
      style: "normal" as const,
      weight: 400 as const,
    },
    {
      name: "IBM Plex Sans",
      data: readFileSync(join(fontsRoot, "IBMPlexSans-SemiBold.ttf")),
      style: "normal" as const,
      weight: 600 as const,
    },
  ];
}
