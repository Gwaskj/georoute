"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function SignOutLink() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={async () => {
        await supabase.auth.signOut();
        // refresh() as well as push(), so the server component re-runs and does
        // not render a cached round for someone who has just signed out.
        router.push("/login");
        router.refresh();
      }}
      className="text-slate-400 hover:text-slate-200"
    >
      Sign out
    </button>
  );
}
