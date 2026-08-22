import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";
export const dynamic = "force-static";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#9A4A2A",
        color: "#F7F1E8",
        fontSize: 14,
        fontWeight: 600,
        letterSpacing: -0.4,
      }}
    >
      JT
    </div>,
    { ...size },
  );
}
