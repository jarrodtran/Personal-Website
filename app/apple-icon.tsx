import { ImageResponse } from "next/og";
import { iconColors } from "@/lib/palette";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const dynamic = "force-static";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: iconColors.bg,
        color: iconColors.fg,
        fontSize: 78,
        fontWeight: 600,
        letterSpacing: -2.2,
      }}
    >
      JT
    </div>,
    { ...size },
  );
}
