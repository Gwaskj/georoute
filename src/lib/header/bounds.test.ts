import { describe, it, expect } from "vitest";
import { clampHeaderTransform, clampTo, HEADER_BOUNDS } from "./bounds";

/**
 * The header must survive whatever is in the database.
 *
 * The editor drives these values by dragging and only ever bounded the low end
 * of scale, so it was possible to save a logo scaled twenty times into a bar 64
 * pixels tall, or positioned somewhere off the side of the page. The editor
 * clamps now, but rows saved before it did are still there -- so the header
 * clamps again when it renders, and this is what says so.
 */
describe("header transform clamping", () => {
  it("leaves sensible values alone", () => {
    expect(clampHeaderTransform({ x: 45, y: 0, scale: 1, rotation: 0 })).toEqual({
      x: 45,
      y: 0,
      scale: 1,
      rotation: 0,
    });
  });

  it("stops a logo dragged off the side of the page", () => {
    const t = clampHeaderTransform({ x: 99999, y: -4000, scale: 1, rotation: 0 });
    expect(t.x).toBe(HEADER_BOUNDS.offsetX.max);
    expect(t.y).toBe(HEADER_BOUNDS.offsetY.min);
  });

  it("stops a scale that would dwarf the header bar", () => {
    expect(clampHeaderTransform({ scale: 20 }).scale).toBe(HEADER_BOUNDS.scale.max);
    expect(clampHeaderTransform({ scale: 0 }).scale).toBe(HEADER_BOUNDS.scale.min);
    // Negative scale mirrors the image, which is never what a drag meant.
    expect(clampHeaderTransform({ scale: -3 }).scale).toBe(HEADER_BOUNDS.scale.min);
  });

  it("keeps rotation within one turn", () => {
    expect(clampHeaderTransform({ rotation: 900 }).rotation).toBe(180);
    expect(clampHeaderTransform({ rotation: -900 }).rotation).toBe(-180);
  });

  it("falls back rather than propagating a missing or broken value", () => {
    // A null column, or a row written before one of these existed.
    expect(clampHeaderTransform({})).toEqual({ x: 0, y: 0, scale: 1, rotation: 0 });
    expect(clampHeaderTransform({ x: null, scale: null })).toMatchObject({
      x: 0,
      scale: 1,
    });
  });

  it("resets a broken number rather than clamping it", () => {
    // NaN and Infinity are treated as absent, not as "very large". A NaN
    // anywhere in a CSS transform silently drops the whole rule, so the
    // element snaps back untransformed with nothing to say why -- and a value
    // that arrived broken is more likely a bug upstream than an intention to
    // scale as far as possible. Falling back to the default is the safer read.
    expect(clampHeaderTransform({ x: NaN, scale: Infinity })).toEqual({
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
    });
    expect(clampTo(NaN, HEADER_BOUNDS.scale, 1)).toBe(1);
    expect(clampTo(-Infinity, HEADER_BOUNDS.offsetX, 0)).toBe(0);
  });
});
