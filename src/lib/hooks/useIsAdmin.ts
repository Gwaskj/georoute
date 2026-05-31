"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    let active = true;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;

      if (!user) {
        setIsAdmin(false);
        return;
      }

      const { data } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

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
