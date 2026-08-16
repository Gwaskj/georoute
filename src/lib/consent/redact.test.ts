import { describe, it, expect } from "vitest";

/**
 * The share-token redaction used before an error report is stored.
 *
 * Kept as its own test because the consequence of getting it wrong is a live
 * credential sitting in the database in plain text: the token in /r/<token>
 * is all that protects a carer's round, which lists client names and home
 * addresses.
 */
function redact(href: string): string {
  return href.replace(/\/r\/[A-Za-z0-9_-]+/, "/r/[redacted]");
}

describe("share token redaction", () => {
  it("removes the token but keeps the path", () => {
    expect(redact("https://www.georoutes.co.uk/r/aGrkxIUUJR8jvvtStyAYkuosLZ-0DH-q8dBbgyK1Zpc"))
      .toBe("https://www.georoutes.co.uk/r/[redacted]");
  });

  it("handles the base64url characters a token can contain", () => {
    // Real tokens are base64url, so hyphens and underscores must not end the match early.
    expect(redact("https://x/r/abc-def_GHI123")).toBe("https://x/r/[redacted]");
  });

  it("leaves other pages untouched", () => {
    for (const url of [
      "https://www.georoutes.co.uk/scheduler",
      "https://www.georoutes.co.uk/help/care-planning",
      "https://www.georoutes.co.uk/",
    ]) {
      expect(redact(url)).toBe(url);
    }
  });

  it("does not leave any part of the token behind", () => {
    const token = "aGrkxIUUJR8jvvtStyAYkuosLZ-0DH-q8dBbgyK1Zpc";
    const out = redact(`https://www.georoutes.co.uk/r/${token}?x=1`);
    expect(out.includes(token)).toBe(false);
    expect(out.includes(token.slice(0, 8))).toBe(false);
  });
});
