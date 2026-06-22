"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Account created. Check your email to verify your account.");
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-xl">
        <h1 className="text-2xl font-semibold text-slate-50 text-center">
          Create your GeoRoute account
        </h1>
        <p className="mt-2 text-sm text-slate-400 text-center">
          Start planning routes and managing staff schedules.
        </p>

        <form onSubmit={handleSignup} className="mt-8 space-y-5">
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

          <div className="space-y-1">
            <label className="text-sm text-slate-300">Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-50 outline-none focus:border-teal-400"
            />
          </div>

          {message && (
            <p className="text-sm text-teal-300">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-gradient-to-r from-green-500 via-teal-500 to-teal-400 px-4 py-2 text-sm font-medium text-slate-950 hover:brightness-110 transition disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="mt-6 text-xs text-slate-400 text-center">
          Already have an account{" "}
          <Link href="/login" className="text-teal-300 hover:text-teal-200">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
