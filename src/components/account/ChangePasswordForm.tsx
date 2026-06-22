"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function ChangePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);

    if (password.length < 6) {
      setIsError(true);
      setMessage("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setIsError(true);
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setIsError(true);
      setMessage(error.message);
      return;
    }

    setIsError(false);
    setMessage("Password updated successfully.");
    setPassword("");
    setConfirm("");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <label className="text-xs text-slate-400">New password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 outline-none focus:border-teal-400"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-slate-400">Confirm new password</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={6}
          className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 outline-none focus:border-teal-400"
        />
      </div>

      {message && (
        <p className={`text-xs ${isError ? "text-red-400" : "text-teal-300"}`}>
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-full border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700 transition disabled:opacity-50"
      >
        {loading ? "Updating…" : "Change password"}
      </button>
    </form>
  );
}
