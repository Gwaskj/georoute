"use client";

import {
  exportSchedulerData,
  importSchedulerData,
  rememberBackupFile,
  recallBackupFile,
} from "@/lib/freeSession";

/**
 * Saving a workspace to a real file, so it can live in OneDrive or SharePoint.
 *
 * There is no Microsoft integration here and deliberately so. OneDrive and
 * SharePoint both present themselves as an ordinary folder on the machine, so
 * writing to a file inside one is all it takes for the data to sync and be
 * available on another computer. Going through the Graph API instead would
 * mean an Azure app registration, an OAuth flow, and asking a care provider to
 * grant a third party access to their tenant -- to achieve exactly what a file
 * write already does.
 *
 * The File System Access API is what makes it a single click: the browser
 * hands back a handle to the chosen file, we keep it, and every later save
 * writes to the same place without a dialog. Chrome and Edge support it;
 * Firefox and Safari do not, and fall back to download and upload, which works
 * everywhere and lands in the same OneDrive folder if that is where the user
 * points it.
 */

/** Minimal shape of the picker APIs, which TypeScript's DOM lib omits. */
type PickerOpts = {
  suggestedName?: string;
  types?: { description: string; accept: Record<string, string[]> }[];
  multiple?: boolean;
};
type PickerWindow = Window & {
  showSaveFilePicker?: (o?: PickerOpts) => Promise<FileSystemFileHandle>;
  showOpenFilePicker?: (o?: PickerOpts) => Promise<FileSystemFileHandle[]>;
};

type PermissionCapable = FileSystemFileHandle & {
  queryPermission?: (d: { mode: "read" | "readwrite" }) => Promise<PermissionState>;
  requestPermission?: (d: { mode: "read" | "readwrite" }) => Promise<PermissionState>;
};

const FILE_TYPES = [
  {
    description: "GeoRoutes workspace",
    accept: { "application/json": [".georoutes.json", ".json"] },
  },
];

export function canLinkAFile(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as PickerWindow;
  return typeof w.showSaveFilePicker === "function";
}

/**
 * Confirm we may still write to a remembered file.
 *
 * A handle survives in IndexedDB across restarts but its permission does not
 * always, so the browser may need to ask again. Called with `interactive` only
 * from a click, because a permission prompt raised without a user gesture is
 * rejected.
 */
async function ensureWritable(
  handle: FileSystemFileHandle,
  interactive: boolean
): Promise<boolean> {
  const h = handle as PermissionCapable;
  try {
    if (!h.queryPermission) return true;
    if ((await h.queryPermission({ mode: "readwrite" })) === "granted") return true;
    if (!interactive || !h.requestPermission) return false;
    return (await h.requestPermission({ mode: "readwrite" })) === "granted";
  } catch {
    return false;
  }
}

async function write(handle: FileSystemFileHandle, text: string): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(text);
  await writable.close();
}

/** The file we are already linked to, if the browser will still let us write. */
export async function linkedFile(): Promise<FileSystemFileHandle | null> {
  const handle = await recallBackupFile();
  if (!handle) return null;
  return (await ensureWritable(handle, false)) ? handle : handle;
}

/** Pick a file to keep this workspace in, and write it straight away. */
export async function linkNewFile(): Promise<string | null> {
  const w = window as PickerWindow;
  if (!w.showSaveFilePicker) return null;

  let handle: FileSystemFileHandle;
  try {
    handle = await w.showSaveFilePicker({
      suggestedName: "georoutes-workspace.json",
      types: FILE_TYPES,
    });
  } catch {
    return null; // The user closed the dialog. Not an error.
  }

  if (!(await ensureWritable(handle, true))) return null;

  await write(handle, await exportSchedulerData());
  await rememberBackupFile(handle);
  return handle.name;
}

/** Write the current workspace to the already-linked file. */
export async function saveToLinkedFile(): Promise<boolean> {
  const handle = await recallBackupFile();
  if (!handle) return false;
  if (!(await ensureWritable(handle, true))) return false;

  await write(handle, await exportSchedulerData());
  return true;
}

/** Open a workspace file and replace what is in this browser with it. */
export async function openFromFile(): Promise<string | null> {
  const w = window as PickerWindow;
  if (!w.showOpenFilePicker) return null;

  let handle: FileSystemFileHandle;
  try {
    [handle] = await w.showOpenFilePicker({ types: FILE_TYPES, multiple: false });
  } catch {
    return null;
  }

  const text = await (await handle.getFile()).text();
  await importSchedulerData(text);
  // Linked as well as opened, so the next save goes back to where it came
  // from rather than asking again.
  await rememberBackupFile(handle);
  return handle.name;
}

export async function forgetLinkedFile(): Promise<void> {
  await rememberBackupFile(null);
}

/* ---- Fallbacks, for browsers without the File System Access API ---- */

export async function downloadCopy(): Promise<void> {
  const blob = new Blob([await exportSchedulerData()], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `georoutes-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoked on a later tick: revoking immediately can cancel the download in
  // some browsers before it has started reading.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export async function restoreFromUpload(file: File): Promise<void> {
  await importSchedulerData(await file.text());
}
