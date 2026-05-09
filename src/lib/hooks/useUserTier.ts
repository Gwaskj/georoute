"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function useUserTier() {
  const supabase = createSupabaseBrowserClient();
  const [isFree, setIsFree] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) {
        setIsFree(true);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_pro")
        .eq("id", auth.user.id)
        .single();

      setIsFree(!profile?.is_pro);
    }

    load();
  }, []);

  return { isFree };
}
