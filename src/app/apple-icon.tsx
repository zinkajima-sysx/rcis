import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background:
            "linear-gradient(135deg, rgb(11, 78, 162) 0%, rgb(32, 119, 216) 68%, rgb(255, 154, 36) 100%)",
          borderRadius: 48,
          color: "white",
          display: "flex",
          fontFamily: "Geist",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1 }}>RCI</div>
          <div style={{ fontSize: 16, letterSpacing: 3 }}>PT KAI</div>
        </div>
      </div>
    ),
    size
  );
}
