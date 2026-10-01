import { ImageResponse } from "next/og";
import { getSelectedWorkBySlug, selectedWorkSlugs, site } from "@/content/site";
import { loadOgFonts, ogColors, ogSize } from "@/lib/og";

export const alt = "Case study";
export const size = ogSize;
export const contentType = "image/png";
export const dynamic = "force-static";

export function generateStaticParams() {
  return selectedWorkSlugs().map((slug) => ({ slug }));
}

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getSelectedWorkBySlug(slug);
  const fonts = loadOgFonts();
  const title = item?.title ?? site.positioning.name;
  const value = item?.panel.value ?? "";
  const label = item?.panel.label ?? site.positioning.headline;
  const kicker = item?.panel.kicker ?? "Case study";

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
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
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
          {kicker}
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: "IBM Plex Sans",
            fontSize: 18,
            color: ogColors.muted,
          }}
        >
          jarrodtran.com
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: "Instrument Serif",
            fontSize: 52,
            letterSpacing: -1.2,
            lineHeight: 1.1,
            maxWidth: 980,
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: "Instrument Serif",
              fontSize: 72,
              color: ogColors.accent,
              lineHeight: 1,
            }}
          >
            {value}
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "IBM Plex Sans",
              fontSize: 24,
              color: ogColors.muted,
              maxWidth: 560,
              lineHeight: 1.3,
            }}
          >
            {label}
          </div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          fontFamily: "IBM Plex Sans",
          fontSize: 20,
          color: ogColors.muted,
        }}
      >
        {site.positioning.name} · Case study
      </div>
    </div>,
    { ...ogSize, fonts },
  );
}
