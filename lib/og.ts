import { readFileSync } from "node:fs";
import { join } from "node:path";

export const ogSize = { width: 1200, height: 630 } as const;

const fontsRoot = join(process.cwd(), "lib/fonts");

export function loadOgFonts() {
  return [
    {
      name: "Instrument Serif",
      data: readFileSync(join(fontsRoot, "InstrumentSerif-Regular.ttf")),
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

export function loadOgPhotoDataUrl(): string {
  const bytes = readFileSync(join(process.cwd(), "public/avatar-og.png"));
  return `data:image/png;base64,${bytes.toString("base64")}`;
}

export const ogColors = {
  bg: "#12151C",
  fg: "#EDE9E0",
  accent: "#9BB6D4",
  muted: "rgba(237, 233, 224, 0.72)",
} as const;
