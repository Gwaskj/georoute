import L from "leaflet";

// Shared teardrop "dropped pin" marker, anchored at its tip so the point sits
// exactly on the coordinate. Used for appointment, home, and office markers
// across the results map so they all read consistently.

const PIN_WIDTH = 26;
const PIN_HEIGHT = 34;

export type PinKind = "appointment" | "home" | "office";

export interface BuildPinIconOptions {
  color: string;
  badge?: string | number;
  highlighted?: boolean;
  /** Single-character glyph drawn in the pin's white inner circle (e.g. "H" for home). */
  glyph?: string;
}

export function buildPinIcon({
  color,
  badge,
  highlighted,
  glyph,
}: BuildPinIconOptions) {
  const scale = highlighted ? 1.25 : 1;
  const width = PIN_WIDTH * scale;
  const height = PIN_HEIGHT * scale;

  const badgeHtml =
    badge !== undefined
      ? `<div style="
          position:absolute; top:-4px; right:-4px;
          min-width:16px; height:16px; padding:0 3px;
          border-radius:8px; background:#0f172a; border:1.5px solid white;
          color:white; font-size:10px; font-weight:700; line-height:16px;
          text-align:center; box-shadow:0 1px 2px rgba(0,0,0,0.5);
        ">${badge}</div>`
      : "";

  const glyphHtml = glyph
    ? `<text x="13" y="17" text-anchor="middle" font-size="10" font-weight="700" fill="${color}">${glyph}</text>`
    : "";

  const html = `
    <div style="position:relative; width:${width}px; height:${height}px;">
      <svg width="${width}" height="${height}" viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 0C5.8 0 0 5.8 0 13c0 9 13 21 13 21s13-12 13-21C26 5.8 20.2 0 13 0z"
          fill="${color}" stroke="white" stroke-width="1.5" />
        <circle cx="13" cy="13" r="6" fill="white" />
        ${glyphHtml}
      </svg>
      ${badgeHtml}
    </div>
  `;

  return L.divIcon({
    className: "",
    html,
    iconSize: [width, height],
    iconAnchor: [width / 2, height],
    popupAnchor: [0, -height],
  });
}
