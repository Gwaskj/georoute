"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const supabase = createSupabaseBrowserClient();

export function useUserTier() {
  const [isFree, setIsFree] = useState<boolean | null>(null);

  useEffect(() => {
    async function load() {
      // 1) Load session user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsFree(true);
        return;
      }

      // 2) Load profile row using correct PK + correct column
      const { data, error } = await supabase
        .from("profiles")
        .select("is_pro")
        .eq("user_id", user.id)   // <-- correct key
        .single();

      if (error) {
        console.error("Error loading user tier:", error);
        setIsFree(true);
        return;
      }

      // 3) Convert boolean to free/pro
      setIsFree(!data?.is_pro);
    }

    load();
  }, []);

  return isFree;
}
