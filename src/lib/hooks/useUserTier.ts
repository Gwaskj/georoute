"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const supabase = createSupabaseBrowserClient();

export function useUserTier() {
  const [isFree, setIsFree] = useState<boolean | null>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsFree(true);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("is_pro")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error loading user tier:", error);
        setIsFree(true);
        return;
      }

      setIsFree(!data?.is_pro);
    }

    load();
  }, []); // FIXED

  return isFree;
}
