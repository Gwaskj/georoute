"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// Singleton Supabase client
const supabase = createSupabaseBrowserClient();

export function useUserTier(userId?: string) {
  const [isFree, setIsFree] = useState<boolean>(true); // default free

  useEffect(() => {
    if (!userId) {
      setIsFree(true);
      return;
    }

    async function load() {
      const { data, error } = await supabase
        .from("profiles")
        .select("tier")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error loading user tier:", error);
        setIsFree(true);
        return;
      }

      setIsFree(data?.tier !== "pro");
    }

    load();
  }, [userId]);

  return isFree;
}
