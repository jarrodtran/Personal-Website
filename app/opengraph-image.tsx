import { ImageResponse } from "next/og";
import { site } from "@/content/site";
import { loadOgFonts, ogColors, ogSize } from "@/lib/og";

export const alt = `${site.positioning.name}. ${site.positioning.lede}`;
export const size = ogSize;
export const contentType = "image/png";
export const dynamic = "force-static";

/** Short card labels for each Selected work figure, keyed by case-study slug. */
const cardLabels: Record<string, string> = {
  "tesla-energy-ai-product": "active users",
  "tesla-energy-portfolio": "annual profit",
  "apple-iphone-india": "unit growth",
  "waymo-engineering-ops": "person org",
};

export default function OpenGraphImage() {
  const fonts = loadOgFonts();
  const figures = site.selectedWork.map(({ slug, panel }) => ({
    slug,
    value: panel.value,
    label: cardLabels[slug] ?? panel.kicker.toLowerCase(),
  }));

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
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div
          style={{
            display: "flex",
            width: "100%",
            borderTop: `2px solid ${ogColors.border}`,
            paddingTop: 28,
          }}
        >
          {figures.map(({ slug, value, label }) => (
            <div
              key={slug}
              style={{ display: "flex", flexDirection: "column", flex: 1 }}
            >
              <div
                style={{
                  display: "flex",
                  fontFamily: "Newsreader, ArrowFallback",
                  fontSize: 56,
                  lineHeight: 1,
                  color: ogColors.accent,
                }}
              >
                {value}
              </div>
              <div
                style={{
                  display: "flex",
                  marginTop: 10,
                  fontFamily: "IBM Plex Sans",
                  fontSize: 24,
                  color: ogColors.muted,
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: "IBM Plex Sans",
            fontSize: 20,
            color: ogColors.muted,
          }}
        >
          jarrodtran.com
        </div>
      </div>
    </div>,
    { ...ogSize, fonts },
  );
}
