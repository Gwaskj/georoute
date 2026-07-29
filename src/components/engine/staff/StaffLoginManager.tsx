"use client";

import { useState } from "react";

interface StaffLoginManagerProps {
  staffLocalId: string;
  staffName: string;
  /** Whether a login already exists, from staff.auth_user_id. */
  hasLogin: boolean;
  onChanged: () => void;
}

/** Readable but not guessable: the owner reads this out or pastes it once. */
function suggestPassword(): string {
  const words = ["river", "copper", "meadow", "lantern", "harbour", "willow", "amber", "cobble"];
  const pick = () => words[Math.floor(Math.random() * words.length)];
  return `${pick()}-${pick()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export default function StaffLoginManager({
  staffLocalId,
  staffName,
  hasLogin,
  onChanged,
}: StaffLoginManagerProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(suggestPassword);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState(false);

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/staff-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffLocalId, email, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not create login");
        return;
      }
      setCreated(true);
      onChanged();
    } catch {
      setError("Could not create login");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/staff-accounts?staffLocalId=${encodeURIComponent(staffLocalId)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "Could not remove login");
        return;
      }
      setOpen(false);
      onChanged();
    } catch {
      setError("Could not remove login");
    } finally {
      setBusy(false);
    }
  };

  if (hasLogin) {
    return (
      <div className="inline-flex items-center gap-2">
        <span className="rounded border border-emerald-600/40 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
          Has login
        </span>
        <button
          type="button"
          onClick={remove}
          disabled={busy}
          className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:border-red-500/60 hover:text-red-300 disabled:opacity-50"
        >
          {busy ? "…" : "Remove login"}
        </button>
        {error && <span className="text-xs text-amber-300">{error}</span>}
      </div>
    );
  }

  if (created) {
    return (
      <span className="rounded border border-emerald-600/40 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
        Login created — pass the details to {staffName}
      </span>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
      >
        Add login
      </button>
    );
  }

  return (
    <div className="w-full rounded border border-slate-700 bg-slate-900/60 p-3">
      <p className="mb-2 text-xs text-slate-400">
        Creates a read-only login for {staffName}. They will be able to see the
        rounds you publish to them and nothing else. Pass these details on
        yourself — no email is sent.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="their@email.com"
          className="min-w-[180px] flex-1 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100"
        />
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-label="Temporary password"
          className="min-w-[160px] flex-1 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100"
        />
        <button
          type="button"
          onClick={create}
          disabled={busy || !email}
          className="rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white disabled:bg-slate-600"
        >
          {busy ? "Creating…" : "Create"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded border border-slate-600 px-2 py-1 text-sm text-slate-300 hover:bg-slate-800"
        >
          Cancel
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-amber-300">{error}</p>}
    </div>
  );
}
