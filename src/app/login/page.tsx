"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client"; // ✅ correct

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    // Give Supabase time to write the cookie
    setTimeout(() => {
      window.location.href = "/";
    }, 200);
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-xl">
        <h1 className="text-2xl font-semibold text-slate-50 text-center">
          Log in to GeoRoute
        </h1>
        <p className="mt-2 text-sm text-slate-400 text-center">
          Access your routes, staff schedules, and planning dashboard.
        </p>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <div className="space-y-1">
            <label className="text-sm text-slate-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 outline-none focus:border-teal-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-slate-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 outline-none focus:border-teal-400"
            />
          </div>

          {errorMsg && (
            <p className="text-red-400 text-sm">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-gradient-to-r from-green-500 via-teal-500 to-teal-400 px-4 py-2 text-sm font-medium text-slate-950 hover:brightness-110 transition disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-xs text-slate-400 text-center">
          Don’t have an account?{" "}
          <Link href="/signup" className="text-teal-300 hover:text-teal-200">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
