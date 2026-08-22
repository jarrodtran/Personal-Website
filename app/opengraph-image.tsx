import { ImageResponse } from "next/og";
import { site } from "@/content/site";

export const alt = `${site.positioning.name}: ${site.positioning.headline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#1A1612",
        color: "#F0EBE3",
        padding: 72,
      }}
    >
      <div
        style={{
          fontSize: 18,
          letterSpacing: 3,
          textTransform: "uppercase",
          color: "#C56A45",
        }}
      >
        jarrodtran.com
      </div>
      <div style={{ display: "flex", flexDirection: "column", maxWidth: 980 }}>
        <div
          style={{
            fontSize: 64,
            fontWeight: 500,
            letterSpacing: -1.6,
            lineHeight: 1.05,
          }}
        >
          {site.positioning.name}
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: 28,
            opacity: 0.82,
            lineHeight: 1.35,
          }}
        >
          {site.positioning.headline}
        </div>
      </div>
      <div style={{ fontSize: 22, color: "#C56A45" }}>
        {site.positioning.status}
      </div>
    </div>,
    { ...size },
  );
}
