"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

type GenerateScheduleProps = {
  algorithm: string;
};

type ScheduleResult = {
  status: string;
  [key: string]: unknown;
};

export default function GenerateSchedule({ algorithm }: GenerateScheduleProps) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScheduleResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate(): Promise<void> {
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in to generate a schedule.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_paid_user")
      .eq("id", user.id)
      .maybeSingle();

    const isPaidUser = profile?.is_paid_user === true;

    const { data, error: fnError } = await supabase.functions.invoke(
      "generate-schedule",
      {
        body: {
          userId: user.id,
          isPaidUser,
          algorithm,
        },
      }
    );

    if (fnError) {
      console.error(fnError);
      setError("Failed to generate schedule.");
      setLoading(false);
      return;
    }

    setResult(data as ScheduleResult);
    setLoading(false);
  }

  return (
    <div className="w-full rounded border bg-white p-4">
      <h2 className="text-lg font-semibold mb-3">Generate Schedule</h2>

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Generating…" : "Generate Schedule"}
      </button>

      {error && (
        <p className="text-red-600 text-sm mt-3">{error}</p>
      )}

      {result && (
        <div className="mt-4 text-sm">
          <p className="font-semibold mb-1">Status: {result.status}</p>

          <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-64">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
