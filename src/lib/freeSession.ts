"use client";

import type { Staff } from "@/store/staffStore";
import type { Appointment } from "@/store/appointmentStore";
import type { Skill } from "@/store/skillsStore";
import type { CustomWindow } from "@/store/customWindowStore";
import type { GlobalSettings } from "@/store/settingsStore";
import type { ScheduledVisit } from "@/lib/scheduler/types";

/**
 * Everything the scheduler keeps, held on the user's own machine.
 *
 * This used to be sessionStorage, and only for free users -- Pro data went to
 * Supabase. Now it is IndexedDB for everyone, which is what lets the product
 * hold no client data at all: names, addresses and rounds never leave the
 * browser that entered them.
 *
 * IndexedDB rather than localStorage for two reasons. Its quota is measured in
 * hundreds of megabytes rather than five, so a large round with cached routing
 * geometry cannot silently hit a ceiling; and it stores structured values, so
 * this file stays the only place that knows the data is serialised at all.
 */
export type FreeSchedulerData = {
  staff: Staff[];
  appointments: Appointment[];
  /** Cached routing results, opaque here -- only the map layer reads them. */
  routes: unknown[];
  windows?: CustomWindow[];
  skills?: Skill[];
  officePostcode?: string;
  selectedStaffIds?: string[];
  /** Kept purely so the results tab survives a tab switch; never authoritative. */
  visits?: ScheduledVisit[];
  /** Skipped or moved occurrences of recurring appointments. */
  exceptions?: unknown[];
  /**
   * Office postcode and working day.
   *
   * Kept in the same record as everything else so it survives a restart and
   * travels with an export -- a backup that restored the rounds but not the
   * office they start from would not be a backup.
   */
  settings?: GlobalSettings;
};

const DB_NAME = "georoute";
const DB_VERSION = 1;
const STORE = "scheduler";
const RECORD_KEY = "current";

/** The pre-IndexedDB sessionStorage key, read once during migration. */
const LEGACY_KEY = "free_scheduler_data";

function emptyData(): FreeSchedulerData {
  return {
    staff: [],
    appointments: [],
    routes: [],
    windows: [],
    skills: [],
    officePostcode: "",
    selectedStaffIds: [],
    visits: [],
    exceptions: [],
  };
}

/** Fill in every optional field, so callers never have to branch on undefined. */
function normalise(parsed: Partial<FreeSchedulerData> | null): FreeSchedulerData {
  if (!parsed) return emptyData();
  return {
    staff: parsed.staff ?? [],
    appointments: parsed.appointments ?? [],
    routes: parsed.routes ?? [],
    windows: parsed.windows ?? [],
    skills: parsed.skills ?? [],
    officePostcode: parsed.officePostcode ?? "",
    selectedStaffIds: parsed.selectedStaffIds ?? [],
    visits: parsed.visits ?? [],
    exceptions: parsed.exceptions ?? [],
    settings: parsed.settings,
  };
}

/* ------------------------------------------------------------------ *
 * IndexedDB, with localStorage as a fallback.
 *
 * Private browsing modes and locked-down enterprise profiles can refuse
 * IndexedDB outright. Every failure path below resolves to null rather than
 * rejecting, so a refusal degrades to localStorage instead of losing work.
 * ------------------------------------------------------------------ */

/**
 * Ask the browser not to evict this data.
 *
 * IndexedDB is "best-effort" by default, which means a browser may clear it
 * when the disk runs low -- fine for a cache, not fine when it is the only
 * copy of tomorrow's rounds. Persistent storage is exempt from that.
 *
 * Chrome grants it silently based on engagement signals such as the site
 * being installed or bookmarked; Firefox prompts; Safari decides on its own.
 * A refusal is not an error and nothing here depends on the answer -- it
 * simply leaves the data evictable, which is where it was before.
 */
async function requestPersistence(): Promise<void> {
  try {
    if (!navigator.storage?.persist) return;
    if (await navigator.storage.persisted()) return;
    await navigator.storage.persist();
  } catch {
    // Not supported, or blocked by policy. Neither is worth reporting.
  }
}

/** Whether the browser has promised not to evict this data. */
export async function isStoragePersistent(): Promise<boolean> {
  try {
    return (await navigator.storage?.persisted?.()) ?? false;
  } catch {
    return false;
  }
}

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;

  // Once per session, alongside the first open rather than awaited by it.
  void requestPersistence();

  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === "undefined") return resolve(null);

    let req: IDBOpenDBRequest;
    try {
      req = indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      return resolve(null);
    }

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
    req.onblocked = () => resolve(null);
  });

  return dbPromise;
}

function idbRead(db: IDBDatabase): Promise<FreeSchedulerData | null> {
  return new Promise((resolve) => {
    try {
      const req = db.transaction(STORE, "readonly").objectStore(STORE).get(RECORD_KEY);
      req.onsuccess = () => resolve((req.result as FreeSchedulerData) ?? null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function idbWrite(db: IDBDatabase, value: FreeSchedulerData): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(value, RECORD_KEY);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
      tx.onabort = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

function lsRead(): FreeSchedulerData | null {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    return raw ? (JSON.parse(raw) as FreeSchedulerData) : null;
  } catch {
    return null;
  }
}

function lsWrite(value: FreeSchedulerData): void {
  try {
    localStorage.setItem(LEGACY_KEY, JSON.stringify(value));
  } catch {}
}

/* ------------------------------------------------------------------ *
 * Serialised access.
 *
 * Callers such as persistFree read the whole record, change one field and
 * write it back. Against synchronous sessionStorage that was safe; against an
 * async store two overlapping edits would both read the same starting value
 * and the second would discard the first. Funnelling every operation through
 * one chain makes each read-modify-write atomic with respect to the others.
 * ------------------------------------------------------------------ */

let chain: Promise<unknown> = Promise.resolve();

function serialise<T>(op: () => Promise<T>): Promise<T> {
  const next = chain.then(op, op);
  chain = next.catch(() => undefined);
  return next;
}

/**
 * Adopt anything left in sessionStorage by the previous build.
 *
 * Runs once. Someone mid-session when the new version deploys would otherwise
 * find an empty scheduler, which looks exactly like data loss even though
 * their old copy is still sitting there untouched.
 */
let migrated = false;

function takeLegacySession(): FreeSchedulerData | null {
  if (migrated) return null;
  migrated = true;
  try {
    const raw = sessionStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(LEGACY_KEY);
    return JSON.parse(raw) as FreeSchedulerData;
  } catch {
    return null;
  }
}

/* The unserialised primitives. Only call these from inside serialise(). */

async function readCurrent(): Promise<FreeSchedulerData> {
  const db = await openDb();
  const stored = db ? await idbRead(db) : lsRead();
  if (stored) return normalise(stored);

  // Nothing stored yet -- this may be the first load after the upgrade.
  const legacy = takeLegacySession();
  if (legacy) {
    const adopted = normalise(legacy);
    await writeThrough(adopted);
    return adopted;
  }

  return emptyData();
}

async function writeThrough(value: FreeSchedulerData): Promise<void> {
  const db = await openDb();
  // A failed IndexedDB write still has somewhere to go. Better a smaller store
  // than a silent loss.
  if (!db || !(await idbWrite(db, value))) lsWrite(value);
}

export async function loadFreeSchedulerData(): Promise<FreeSchedulerData | null> {
  return serialise(readCurrent);
}

export async function saveFreeSchedulerData(payload: FreeSchedulerData): Promise<void> {
  await serialise(async () => {
    const value = normalise(payload);
    await writeThrough(value);
  });
}

/**
 * Read, change and write back as one atomic step.
 *
 * The stores each own one slice of the record but have to save the whole
 * thing, so they read it, replace their slice and write it back. Doing that as
 * a separate load and save lets two stores read the same starting value and
 * the second write drop the first one's slice -- add a staff member and an
 * appointment in the same tick and one of them vanishes.
 *
 * Holding the chain for the whole cycle is what makes it safe. Callers should
 * reach for this rather than load-then-save whenever the new value depends on
 * the old one.
 */
export async function updateSchedulerData(
  mutate: (current: FreeSchedulerData) => FreeSchedulerData
): Promise<FreeSchedulerData> {
  return serialise(async () => {
    const current = await readCurrent();
    const next = normalise(mutate(current));
    await writeThrough(next);
    return next;
  });
}

/**
 * The user's backup, and their route onto a new machine.
 *
 * With nothing held server-side this is the only way data survives a cleared
 * browser or a replaced laptop, so it is a feature rather than a convenience.
 */
export async function exportSchedulerData(): Promise<string> {
  const data = await loadFreeSchedulerData();
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), data }, null, 2);
}

export async function importSchedulerData(json: string): Promise<FreeSchedulerData> {
  const parsed = JSON.parse(json);
  // Accept both the wrapped export and a bare record, because someone will
  // eventually paste just the inner object.
  const data = normalise(parsed?.data ?? parsed);
  await saveFreeSchedulerData(data);
  return data;
}

export async function clearSchedulerData(): Promise<void> {
  await saveFreeSchedulerData(emptyData());
}

/* ------------------------------------------------------------------ *
 * The linked backup file.
 *
 * A FileSystemFileHandle is structured-cloneable, so IndexedDB can keep the
 * one the user picked and we can write to the same file again next time
 * without asking them to find it. That is what makes "save to OneDrive" work
 * as a single click rather than a file dialog every time.
 *
 * Stored under its own key in the existing object store rather than a new
 * store, which would need a database version bump and a migration for
 * something this small.
 * ------------------------------------------------------------------ */

const BACKUP_HANDLE_KEY = "backupFile";

function idbPut(db: IDBDatabase, key: string, value: unknown): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
      tx.onabort = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

function idbGet<T>(db: IDBDatabase, key: string): Promise<T | null> {
  return new Promise((resolve) => {
    try {
      const req = db.transaction(STORE, "readonly").objectStore(STORE).get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function rememberBackupFile(
  handle: FileSystemFileHandle | null
): Promise<void> {
  const db = await openDb();
  if (!db) return;
  await idbPut(db, BACKUP_HANDLE_KEY, handle);
}

export async function recallBackupFile(): Promise<FileSystemFileHandle | null> {
  const db = await openDb();
  if (!db) return null;
  return idbGet<FileSystemFileHandle>(db, BACKUP_HANDLE_KEY);
}
