"use client";

import { LogoDoodle } from "@/lib/theme-types";

interface Props {
  doodle: LogoDoodle;
  color: string;
  className?: string;
}

export default function SeasonalDoodle({ doodle, color, className = "" }: Props) {
  if (doodle === "none") return null;

  const svgProps = {
    className: `pointer-events-none select-none ${className}`,
    style: { filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))" },
  };

  switch (doodle) {
    case "santa-hat":
      return (
        <svg {...svgProps} width="32" height="28" viewBox="0 0 32 28">
          {/* Brim */}
          <ellipse cx="16" cy="24" rx="16" ry="4" fill="white" opacity="0.9" />
          {/* Hat body */}
          <path d="M4 24 L16 2 L28 24 Z" fill={color} />
          {/* Pompom */}
          <circle cx="16" cy="3" r="4" fill="white" />
          {/* Stripe */}
          <path d="M4 24 L28 24" stroke="white" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case "party-hat":
      return (
        <svg {...svgProps} width="28" height="30" viewBox="0 0 28 30">
          <path d="M2 28 L14 2 L26 28 Z" fill={color} />
          <path d="M2 28 L26 28" stroke="white" strokeWidth="2.5" />
          <circle cx="14" cy="2" r="3" fill="white" />
          {/* Stripes */}
          <line x1="7" y1="20" x2="21" y2="20" stroke="white" strokeWidth="1.5" strokeOpacity="0.6" />
          <line x1="9" y1="13" x2="19" y2="13" stroke="white" strokeWidth="1.5" strokeOpacity="0.6" />
        </svg>
      );

    case "halo":
      return (
        <svg {...svgProps} width="36" height="16" viewBox="0 0 36 16">
          <ellipse
            cx="18"
            cy="8"
            rx="15"
            ry="6"
            fill="none"
            stroke={color}
            strokeWidth="3"
            opacity="0.9"
          />
          <ellipse
            cx="18"
            cy="8"
            rx="15"
            ry="6"
            fill="none"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="1"
          />
        </svg>
      );

    case "hearts":
      return (
        <svg {...svgProps} width="40" height="24" viewBox="0 0 40 24">
          {/* Three hearts of varying sizes */}
          <HeartPath cx={8} cy={16} r={5} fill={color} opacity={0.9} />
          <HeartPath cx={22} cy={10} r={7} fill={color} opacity={1} />
          <HeartPath cx={36} cy={16} r={4} fill={color} opacity={0.75} />
        </svg>
      );

    case "shamrock":
      return (
        <svg {...svgProps} width="30" height="32" viewBox="0 0 30 32">
          {/* Three leaves */}
          <circle cx="15" cy="10" r="7" fill={color} opacity="0.9" />
          <circle cx="8" cy="17" r="7" fill={color} opacity="0.9" />
          <circle cx="22" cy="17" r="7" fill={color} opacity="0.9" />
          {/* Stem */}
          <path d="M15 24 Q15 28 13 31" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* Center overlap */}
          <circle cx="15" cy="17" r="4" fill={color} />
        </svg>
      );

    case "fireworks":
      return (
        <svg {...svgProps} width="40" height="36" viewBox="0 0 40 36">
          {/* Burst lines radiating from centre */}
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * Math.PI * 2) / 8;
            const x1 = 20 + Math.cos(angle) * 5;
            const y1 = 18 + Math.sin(angle) * 5;
            const x2 = 20 + Math.cos(angle) * 14;
            const y2 = 18 + Math.sin(angle) * 14;
            return (
              <line
                key={i}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
              />
            );
          })}
          <circle cx="20" cy="18" r="4" fill={color} />
          {/* Sparkles at tips */}
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * Math.PI * 2) / 8;
            const x = 20 + Math.cos(angle) * 16;
            const y = 18 + Math.sin(angle) * 16;
            return <circle key={i} cx={x} cy={y} r={1.5} fill={color} />;
          })}
        </svg>
      );

    case "top-hat":
      return (
        <svg {...svgProps} width="32" height="28" viewBox="0 0 32 28">
          {/* Brim */}
          <rect x="2" y="20" width="28" height="5" rx="2" fill={color} />
          {/* Crown */}
          <rect x="9" y="4" width="14" height="17" rx="1" fill={color} />
          {/* Band */}
          <rect x="9" y="16" width="14" height="3" fill="rgba(255,255,255,0.3)" />
        </svg>
      );

    case "flowers":
      return (
        <svg {...svgProps} width="44" height="28" viewBox="0 0 44 28">
          <FlowerShape cx={8} cy={16} color={color} r={5} />
          <FlowerShape cx={22} cy={10} color={color} r={7} />
          <FlowerShape cx={36} cy={16} color={color} r={5} />
        </svg>
      );

    case "spider-web":
      return (
        <svg {...svgProps} width="36" height="36" viewBox="0 0 36 36">
          {/* Radial lines */}
          {Array.from({ length: 6 }).map((_, i) => {
            const angle = (i * Math.PI) / 3;
            return (
              <line
                key={i}
                x1="18" y1="18"
                x2={18 + Math.cos(angle) * 16}
                y2={18 + Math.sin(angle) * 16}
                stroke={color}
                strokeWidth="1"
              />
            );
          })}
          {/* Concentric hexagons */}
          {[5, 10, 15].map((r, ri) => (
            <polygon
              key={ri}
              points={Array.from({ length: 6 })
                .map((_, i) => {
                  const a = (i * Math.PI) / 3;
                  return `${18 + Math.cos(a) * r},${18 + Math.sin(a) * r}`;
                })
                .join(" ")}
              fill="none"
              stroke={color}
              strokeWidth="1"
            />
          ))}
        </svg>
      );

    default:
      return null;
  }
}

function HeartPath({
  cx, cy, r, fill, opacity,
}: {
  cx: number; cy: number; r: number; fill: string; opacity: number;
}) {
  return (
    <path
      d={`M${cx},${cy + r * 0.2} C${cx - r},${cy - r * 0.4} ${cx - r * 1.4},${cy + r * 0.4} ${cx},${cy + r * 1.1} C${cx + r * 1.4},${cy + r * 0.4} ${cx + r},${cy - r * 0.4} ${cx},${cy + r * 0.2}`}
      fill={fill}
      opacity={opacity}
    />
  );
}

function FlowerShape({
  cx, cy, color, r,
}: {
  cx: number; cy: number; color: string; r: number;
}) {
  const petals = 5;
  return (
    <g>
      {Array.from({ length: petals }).map((_, i) => {
        const angle = (i * Math.PI * 2) / petals;
        return (
          <ellipse
            key={i}
            cx={cx + Math.cos(angle) * r * 0.6}
            cy={cy + Math.sin(angle) * r * 0.6}
            rx={r * 0.5}
            ry={r * 0.3}
            fill={color}
            opacity={0.85}
            transform={`rotate(${(angle * 180) / Math.PI},${cx + Math.cos(angle) * r * 0.6},${cy + Math.sin(angle) * r * 0.6})`}
          />
        );
      })}
      <circle cx={cx} cy={cy} r={r * 0.35} fill="rgba(255,220,50,0.9)" />
    </g>
  );
}
