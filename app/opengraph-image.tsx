import { ImageResponse } from "next/og";
import { site } from "@/content/site";
import { loadOgFonts, ogColors, ogSize } from "@/lib/og";

export const alt = `${site.positioning.name}. ${site.positioning.lede}`;
export const size = ogSize;
export const contentType = "image/png";
export const dynamic = "force-static";

export default function OpenGraphImage() {
  const fonts = loadOgFonts();
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: ogColors.bg,
        color: ogColors.fg,
        padding: 64,
      }}
    >
      <div
        style={{
          display: "flex",
          fontFamily: "IBM Plex Sans",
          fontSize: 24,
          fontWeight: 600,
          letterSpacing: 3,
          textTransform: "uppercase",
          color: ogColors.accent,
        }}
      >
        {site.positioning.name}
      </div>
      <div
        style={{
          display: "flex",
          fontFamily: "Newsreader, ArrowFallback",
          fontSize: 72,
          letterSpacing: -1.8,
          lineHeight: 1.08,
          maxWidth: 1000,
        }}
      >
        {site.positioning.lede}
      </div>
      <div
        style={{
          display: "flex",
          width: "100%",
          borderTop: `2px solid ${ogColors.border}`,
          paddingTop: 28,
          fontFamily: "IBM Plex Sans",
          fontSize: 24,
          color: ogColors.muted,
        }}
      >
        Essays, work and résumé at jarrodtran.com
      </div>
    </div>,
    { ...ogSize, fonts },
  );
}
