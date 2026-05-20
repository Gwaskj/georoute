"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase/supabaseClient";

export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!active) return;

      if (!user) {
        setIsAdmin(false);
        return;
      }

      const { data } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle(); // safer than .single()

      if (!active) return;

      setIsAdmin(!!data);
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  return isAdmin;
}
