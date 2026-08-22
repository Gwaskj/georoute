"use client";

import { useEffect, useRef, useState } from "react";
import {
  canLinkAFile,
  linkNewFile,
  linkedFile,
  saveToLinkedFile,
  openFromFile,
  forgetLinkedFile,
  downloadCopy,
  restoreFromUpload,
} from "@/lib/backup/file";

/**
 * Keeping a workspace in a file, so it can live in OneDrive or SharePoint.
 *
 * This is not a convenience. Nothing is stored on our servers, so this file is
 * the only thing standing between a cleared browser and a lost workspace, and
 * it is the only way to carry a round between two computers.
 *
 * Pointing it at a synced OneDrive or SharePoint folder is what makes that
 * work: the file syncs like any other, and opening it on another machine
 * restores the workspace there.
 */
export default function DataBackup() {
  const [supported, setSupported] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    // Both settled asynchronously. canLinkAFile() is a synchronous check, but
    // setting from it directly in the effect is a render-during-effect that
    // React warns about, and the file lookup has to be awaited anyway.
    (async () => {
      const handle = await linkedFile();
      if (cancelled) return;
      setSupported(canLinkAFile());
      setFileName(handle?.name ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const say = (m: string) => {
    setMessage(m);
    setTimeout(() => setMessage(null), 4000);
  };

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(label);
    try {
      await fn();
    } catch {
      say("That did not work. The file may have been moved or renamed.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed text-slate-400">
        Your staff, clients and rounds are held in this browser and nowhere
        else. Keeping a copy in a file is what lets you move to another
        computer, and what you would restore from if this browser were cleared.
      </p>

      {supported ? (
        <>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            {fileName ? (
              <>
                <p className="text-xs text-slate-400">Linked file</p>
                <p className="mt-0.5 break-all text-sm font-medium text-slate-100">
                  {fileName}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() =>
                      run("save", async () => {
                        say(
                          (await saveToLinkedFile())
                            ? "Saved."
                            : "Could not write to that file. Choose it again."
                        );
                      })
                    }
                    className="rounded-lg bg-gradient-to-r from-teal-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:brightness-110 disabled:opacity-40"
                  >
                    {busy === "save" ? "Saving…" : "Save now"}
                  </button>
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() =>
                      run("relink", async () => {
                        const n = await linkNewFile();
                        if (n) {
                          setFileName(n);
                          say("Linked and saved.");
                        }
                      })
                    }
                    className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
                  >
                    Change file
                  </button>
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() =>
                      run("forget", async () => {
                        await forgetLinkedFile();
                        setFileName(null);
                        say("Unlinked. The file itself is untouched.");
                      })
                    }
                    className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 transition hover:bg-slate-800"
                  >
                    Unlink
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-300">
                  No file linked yet.
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  Choose one inside your OneDrive or SharePoint folder and it
                  will sync like any other file — then open it on another
                  computer to pick up where you left off.
                </p>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() =>
                    run("link", async () => {
                      const n = await linkNewFile();
                      if (n) {
                        setFileName(n);
                        say("Linked and saved.");
                      }
                    })
                  }
                  className="mt-3 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:brightness-110 disabled:opacity-40"
                >
                  {busy === "link" ? "Choosing…" : "Choose a file"}
                </button>
              </>
            )}
          </div>

          <div>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() =>
                run("open", async () => {
                  const n = await openFromFile();
                  if (n) {
                    setFileName(n);
                    say("Opened. This browser now holds what was in that file.");
                  }
                })
              }
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
            >
              {busy === "open" ? "Opening…" : "Open a saved workspace"}
            </button>
            <p className="mt-1.5 text-xs text-slate-400">
              Replaces everything currently in this browser.
            </p>
          </div>
        </>
      ) : (
        <p className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs leading-relaxed text-slate-400">
          This browser cannot save straight to a file, so use the download and
          restore buttons below. Saving the download into your OneDrive or
          SharePoint folder gives you the same result, with one extra step.
          Chrome and Edge on a computer support the one-click version.
        </p>
      )}

      <div className="flex flex-wrap gap-2 border-t border-slate-800 pt-4">
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => run("download", downloadCopy)}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
        >
          Download a copy
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => uploadRef.current?.click()}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
        >
          Restore from a file
        </button>
        <input
          ref={uploadRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          aria-label="Choose a workspace file to restore"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            run("restore", async () => {
              await restoreFromUpload(file);
              say("Restored. This browser now holds what was in that file.");
            });
          }}
        />
      </div>

      {message && (
        <p role="status" className="text-xs text-teal-300">
          {message}
        </p>
      )}
    </div>
  );
}
