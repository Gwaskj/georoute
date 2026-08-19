"use client";

import { useEffect } from "react";
import { redact } from "@/lib/consent/redact";

/**
 * Catches errors that would otherwise only exist in a user's console.
 *
 * Two things are listened for: uncaught exceptions, and promise rejections
 * nobody handled. The second matters more here than it looks -- almost every
 * failure path in this app is an await on Supabase or the routing function,
 * and an unhandled rejection produces no visible symptom at all beyond a
 * feature quietly not working.
 *
 * Render errors are not covered here; those never reach window.onerror because
 * React intercepts them. ErrorBoundary handles those.
 */

/**
 * Strips the fragment out of a URL before it is recorded.
 *
 * A round link carries the whole round in its fragment -- client names, home
 * addresses and visit times. Storing that in an error report would put it into
 * the database in plain text, and onto any screen that displays those reports,
 * which is the one thing this product no longer takes custody of.
 *
 * Which page it was is still worth keeping, so the path is preserved and only
 * the fragment is dropped. See lib/consent/redact.
 */

/** Reports are fire-and-forget. A failure to report must never break a page. */
export function reportError(
  message: string,
  opts: { stack?: string | null; source?: string; context?: Record<string, unknown> } = {}
): void {
  try {
    const body = JSON.stringify({
      message,
      stack: opts.stack ?? null,
      source: opts.source ?? "client",
      url: typeof location !== "undefined" ? redact(location.href) : null,
      context: opts.context ?? {},
    });

    // sendBeacon survives the page being closed or navigated away from, which
    // is exactly what a user does when something breaks. It is unavailable in
    // some browsers and refuses oversized payloads, hence the fetch fallback.
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const ok = navigator.sendBeacon("/api/errors", new Blob([body], { type: "application/json" }));
      if (ok) return;
    }

    void fetch("/api/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Reporting an error must not itself throw.
  }
}

export default function ErrorReporter() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      // Cross-origin script errors arrive as a bare "Script error." with no
      // stack and no file. They are unactionable and would drown everything
      // else, so they are dropped rather than stored.
      if (!e.message || e.message === "Script error.") return;
      reportError(e.message, { stack: e.error?.stack ?? null, source: "client" });
    };

    const onRejection = (e: PromiseRejectionEvent) => {
      const reason = e.reason;
      const message =
        reason instanceof Error
          ? reason.message
          : typeof reason === "string"
            ? reason
            : "Unhandled promise rejection";
      reportError(message, {
        stack: reason instanceof Error ? reason.stack : null,
        source: "client",
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
