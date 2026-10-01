import { ImageResponse } from "next/og";
import { site } from "@/content/site";
import { loadOgFonts, loadOgPhotoDataUrl, ogColors, ogSize } from "@/lib/og";

export const alt = `${site.positioning.name}: ${site.positioning.headline}`;
export const size = ogSize;
export const contentType = "image/png";
export const dynamic = "force-static";

export default function OpenGraphImage() {
  const photo = loadOgPhotoDataUrl();
  const fonts = loadOgFonts();

  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        background: ogColors.bg,
        color: ogColors.fg,
        padding: 64,
        gap: 48,
      }}
    >
      <img
        src={photo}
        alt=""
        width={280}
        height={280}
        style={{
          width: 280,
          height: 280,
          objectFit: "cover",
          borderRadius: 8,
          border: `1px solid ${ogColors.accent}`,
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flex: 1,
          paddingTop: 8,
          paddingBottom: 8,
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
            maxWidth: 720,
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: "Instrument Serif",
              fontSize: 64,
              letterSpacing: -1.6,
              lineHeight: 1.05,
            }}
          >
            {site.positioning.name}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 18,
              fontFamily: "IBM Plex Sans",
              fontSize: 26,
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
      </div>
    </div>,
    { ...ogSize, fonts },
  );
}
