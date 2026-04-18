import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background:
            "linear-gradient(135deg, rgb(11, 78, 162) 0%, rgb(32, 119, 216) 68%, rgb(255, 154, 36) 100%)",
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
            alignItems: "center",
            border: "10px solid rgba(255,255,255,0.18)",
            borderRadius: "120px",
            display: "flex",
            height: 360,
            justifyContent: "center",
            width: 360,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 160, fontWeight: 800, lineHeight: 1 }}>
              RCI
            </div>
            <div
              style={{
                fontSize: 36,
                letterSpacing: 6,
                opacity: 0.92,
                textTransform: "uppercase",
              }}
            >
              Rail Clinic
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
