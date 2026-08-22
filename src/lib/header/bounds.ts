/**
 * Limits on how far the header editor can move the logo and banner.
 *
 * The editor drives these by dragging, and only the lower end of scale was
 * bounded -- so dragging far enough saved a scale of 20, or an offset that put
 * the logo somewhere off the side of the page. The header bar is 64 pixels
 * tall; nothing outside these ranges describes a header anyone wanted.
 *
 * Applied in two places on purpose. The editor clamps so a drag simply stops
 * rather than saving something unusable, and the header clamps again when it
 * renders, so a value already in the database -- or one written by hand --
 * still cannot break the page. Sharing the numbers here is what stops those
 * two disagreeing.
 */

export const HEADER_BOUNDS = {
  /** Below 0.2 it disappears; above 3 it is larger than the bar it sits in. */
  scale: { min: 0.2, max: 3 },
  /** Enough to position within the bar, not enough to lose off the edge. */
  offsetX: { min: -200, max: 400 },
  offsetY: { min: -100, max: 100 },
  rotation: { min: -180, max: 180 },
} as const;

/** Clamp, treating anything not finite as the given fallback. */
export function clampTo(
  value: number | null | undefined,
  { min, max }: { min: number; max: number },
  fallback: number
): number {
  const n = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.min(max, Math.max(min, n));
}

export interface HeaderTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

/** A safe transform, whatever was stored. */
export function clampHeaderTransform(t: {
  x?: number | null;
  y?: number | null;
  scale?: number | null;
  rotation?: number | null;
}): HeaderTransform {
  return {
    x: clampTo(t.x, HEADER_BOUNDS.offsetX, 0),
    y: clampTo(t.y, HEADER_BOUNDS.offsetY, 0),
    scale: clampTo(t.scale, HEADER_BOUNDS.scale, 1),
    rotation: clampTo(t.rotation, HEADER_BOUNDS.rotation, 0),
  };
}
