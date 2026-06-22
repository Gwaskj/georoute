"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export function useUserTier() {
  const [isFree, setIsFree] = useState<boolean>(true);

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
        .maybeSingle();

      if (error) {
        setIsFree(true);
        return;
      }

      setIsFree(!data?.is_pro);
    }

    load();
  }, []);

  return isFree;
}
