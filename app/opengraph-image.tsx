import { ImageResponse } from "next/og";
import { site } from "@/content/site";
import { loadOgFonts, ogColors, ogSize } from "@/lib/og";

export const alt = `${site.positioning.name}: ${site.positioning.headline}`;
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
          fontSize: 18,
          fontWeight: 600,
          letterSpacing: 3,
          textTransform: "uppercase",
          color: ogColors.accent,
        }}
      >
        jarrodtran.com
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          maxWidth: 980,
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: "Instrument Serif",
            fontSize: 72,
            letterSpacing: -1.6,
            lineHeight: 1.05,
          }}
        >
          {site.positioning.name}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontFamily: "IBM Plex Sans",
            fontSize: 28,
            color: ogColors.muted,
            lineHeight: 1.35,
          }}
        >
          {site.positioning.headline}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          fontFamily: "IBM Plex Sans",
          fontSize: 22,
          fontWeight: 600,
          color: ogColors.accent,
        }}
      >
        {site.positioning.status}
      </div>
    </div>,
    { ...ogSize, fonts },
  );
}
