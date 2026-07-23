import { ImageResponse } from "next/og";

export const alt = "GeoRoutes – Smarter Route Planning";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #020617 0%, #0f172a 50%, #020617 100%)",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Teal glow top-left */}
        <div
          style={{
            position: "absolute",
            top: -120,
            left: -80,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(20,184,166,0.3) 0%, transparent 70%)",
          }}
        />
        {/* Purple glow top-right */}
        <div
          style={{
            position: "absolute",
            top: -60,
            right: -60,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)",
          }}
        />

        {/* Route dots decoration */}
        <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 40 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              <div
                style={{
                  width: i === 0 || i === 4 ? 18 : 12,
                  height: i === 0 || i === 4 ? 18 : 12,
                  borderRadius: "50%",
                  background: i === 0 || i === 4 ? "#2dd4bf" : "#475569",
                  border: i === 0 || i === 4 ? "3px solid #0f766e" : "2px solid #334155",
                }}
              />
              {i < 4 && (
                <div
                  style={{
                    width: 60,
                    height: 2,
                    background: "linear-gradient(90deg, #2dd4bf40, #47556960, #2dd4bf40)",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Brand name */}
        <div
          style={{
            fontSize: 80,
            fontWeight: 700,
            color: "#f8fafc",
            letterSpacing: "-2px",
            lineHeight: 1,
            marginBottom: 16,
            display: "flex",
          }}
        >
          Geo
          <span style={{ color: "#2dd4bf" }}>Route</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: "#94a3b8",
            letterSpacing: "0.5px",
            marginBottom: 40,
            display: "flex",
          }}
        >
          Smarter Route Planning for Field Teams
        </div>

        {/* Feature pills */}
        <div style={{ display: "flex", gap: 16 }}>
          {["Optimised Schedules", "Real Road Distances", "Free to Start"].map((label) => (
            <div
              key={label}
              style={{
                padding: "8px 20px",
                borderRadius: 999,
                border: "1px solid #334155",
                background: "#1e293b",
                color: "#cbd5e1",
                fontSize: 18,
                display: "flex",
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* URL badge */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            right: 48,
            fontSize: 16,
            color: "#475569",
            display: "flex",
          }}
        >
          georoutes.co.uk
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
