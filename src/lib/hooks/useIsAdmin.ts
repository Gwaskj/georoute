"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

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

      const { data, error } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!active) return;

      if (error) {
        console.error("useIsAdmin error:", error);
        setIsAdmin(false);
        return;
      }

      setIsAdmin(data?.is_admin === true);
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  return isAdmin;
}
