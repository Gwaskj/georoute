import { describe, it, expect } from "vitest";
import { redact } from "./redact";

/**
 * URL redaction, used before an error report is stored.
 *
 * This used to test a copy of the implementation pasted into the test file,
 * which is how it kept passing while the thing it guarded moved: it checked
 * that /r/<token> was stripped long after /r/ had been deleted. It imports the
 * real function now.
 *
 * The consequence of getting this wrong is a carer's whole round -- client
 * names, home addresses, visit times -- sitting in the database in plain text
 * and on the admin errors screen.
 */
describe("URL redaction", () => {
  it("drops the fragment, which is where a round lives", () => {
    expect(
      redact("https://www.georoutes.co.uk/my-round#1c3RhZmZOYW1lIjoiUHJpeWEi")
    ).toBe("https://www.georoutes.co.uk/my-round");
  });

  it("leaves nothing of the round behind", () => {
    const round = "1c3RhZmZOYW1lIjoiUHJpeWEiLCJzdG9wcyI6W3siY2xpZW50TmFtZSI6Ik1hcmdhcmV0";
    const out = redact(`https://www.georoutes.co.uk/my-round#${round}`);

    expect(out.includes(round)).toBe(false);
    expect(out.includes(round.slice(0, 8))).toBe(false);
    expect(out.includes("#")).toBe(false);
  });

  it("keeps the query string, which says which page failed", () => {
    expect(redact("https://www.georoutes.co.uk/scheduler?tab=results#x")).toBe(
      "https://www.georoutes.co.uk/scheduler?tab=results"
    );
  });

  it("leaves ordinary pages untouched", () => {
    for (const url of [
      "https://www.georoutes.co.uk/scheduler",
      "https://www.georoutes.co.uk/care-planning",
      "https://www.georoutes.co.uk/",
    ]) {
      expect(redact(url)).toBe(url);
    }
  });

  it("handles a bare fragment marker", () => {
    expect(redact("https://www.georoutes.co.uk/my-round#")).toBe(
      "https://www.georoutes.co.uk/my-round"
    );
  });

  it("strips everything after the first #, including further ones", () => {
    expect(redact("https://x/my-round#abc#def")).toBe("https://x/my-round");
  });
});
