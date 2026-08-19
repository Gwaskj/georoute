import type { SharedSchedulePayload } from "./types";

/**
 * A round encoded into a URL fragment.
 *
 * The point of the fragment is that browsers never send it to a server: it is
 * stripped from the request line and from the Referer header. A carer opening
 * their round means their clients' names and addresses reach their phone
 * without passing through us, so there is no row to hold, secure or account
 * for.
 *
 * The cost is that a link cannot be withdrawn. Whoever holds it holds the
 * round, permanently -- there is no server-side record to revoke. Links are
 * issued per day and go stale rather than being cancelled, and the page says
 * plainly which day it is for.
 */

/** Version prefix, so an old link stays readable when the format changes. */
const RAW = "0";
const DEFLATED = "1";

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  // Chunked: spreading a large array into String.fromCharCode blows the
  // argument limit somewhere around a hundred thousand stops, and failing on
  // big rounds is exactly the case that matters.
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array {
  const padded = text.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function pipe(bytes: Uint8Array, stream: TransformStream): Promise<Uint8Array> {
  const blob = new Blob([bytes as BlobPart]);
  const buf = await new Response(blob.stream().pipeThrough(stream)).arrayBuffer();
  return new Uint8Array(buf);
}

/**
 * Encode a round for the fragment.
 *
 * Compression is what keeps this practical: a round of fifty visits repeats
 * postcode prefixes, times and durations, and deflates to roughly a fifth of
 * its JSON. It stays inside a QR code, which is how a link gets from a manager's
 * screen to a carer's phone without being typed.
 */
export async function encodeRound(payload: SharedSchedulePayload): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(payload));

  if (typeof CompressionStream === "undefined") return RAW + toBase64Url(json);

  try {
    return DEFLATED + toBase64Url(await pipe(json, new CompressionStream("deflate-raw")));
  } catch {
    // Older Safari knows CompressionStream but not deflate-raw. A longer link
    // still works; a thrown error does not.
    return RAW + toBase64Url(json);
  }
}

/** Returns null for anything unreadable -- a truncated paste, an old format. */
export async function decodeRound(
  encoded: string
): Promise<SharedSchedulePayload | null> {
  if (!encoded) return null;

  try {
    const version = encoded[0];
    const body = fromBase64Url(encoded.slice(1));

    let json: Uint8Array;
    if (version === DEFLATED) {
      json = await pipe(body, new DecompressionStream("deflate-raw"));
    } else if (version === RAW) {
      json = body;
    } else {
      return null;
    }

    const parsed = JSON.parse(new TextDecoder().decode(json));

    // Shape check. The fragment is user-editable by definition, so a round
    // reaching the renderer has to have the parts the renderer indexes into.
    if (!parsed || typeof parsed !== "object") return null;
    if (!Array.isArray(parsed.stops)) return null;

    return {
      staffName: String(parsed.staffName ?? ""),
      originLabel: String(parsed.originLabel ?? ""),
      originPostcode: String(parsed.originPostcode ?? ""),
      destinationLabel: String(parsed.destinationLabel ?? ""),
      destinationPostcode: String(parsed.destinationPostcode ?? ""),
      stops: parsed.stops,
      breaks: Array.isArray(parsed.breaks) ? parsed.breaks : [],
      generatedAt: String(parsed.generatedAt ?? ""),
    };
  } catch {
    return null;
  }
}

/** The whole link, fragment and all. */
export async function roundLink(
  siteUrl: string,
  payload: SharedSchedulePayload
): Promise<string> {
  return `${siteUrl.replace(/\/$/, "")}/my-round#${await encodeRound(payload)}`;
}
