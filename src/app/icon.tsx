import { ImageResponse } from "next/og";

// Favicon en PNG (compatible con todos los navegadores). Marca BData:
// cuadrado verde brand + "b" blanca.
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#059669",
          borderRadius: 110,
          color: "#ffffff",
          fontSize: 360,
          fontWeight: 800,
          fontFamily: "sans-serif",
          lineHeight: 1,
          paddingBottom: 28,
        }}
      >
        b
      </div>
    ),
    { ...size },
  );
}
