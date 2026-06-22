"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import AdBanner from "@/components/AdBanner";

type FreeTierAdSlotProps = {
  className?: string;
};

// Renders an AdBanner only for anonymous or free-tier users.
// Paying Pro subscribers never see ads, on this slot or any other.
export default function FreeTierAdSlot({ className }: FreeTierAdSlotProps) {
  const [showAd, setShowAd] = useState(false);

  useEffect(() => {
    let active = true;

    async function check() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (active) setShowAd(true);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_pro")
        .eq("user_id", user.id)
        .maybeSingle();

      if (active) setShowAd(!profile?.is_pro);
    }

    check();
    return () => {
      active = false;
    };
  }, []);

  if (!showAd) return null;

  return <AdBanner className={className} />;
}
