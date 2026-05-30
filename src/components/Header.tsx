"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useIsAdmin } from "@/lib/hooks/useIsAdmin";
import { HeaderStructure, NavItem, BrandConfig } from "./HeaderStructure";

export default function Header({
  logoUrl,
  bannerUrl,
  logo_x,
  logo_y,
  logo_scale,
  logo_rotation,
  banner_offset_x,
  banner_offset_y,
  banner_scale,
  banner_rotation,
  brand,
  navItems,
}: {
  logoUrl: string | null;
  bannerUrl: string | null;
  logo_x: number;
  logo_y: number;
  logo_scale: number;
  logo_rotation: number;
  banner_offset_x: number;
  banner_offset_y: number;
  banner_scale: number;
  banner_rotation: number;
  brand: BrandConfig;
  navItems: NavItem[];
}) {
  const isAdmin = useIsAdmin();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      const u = auth?.user || null;
      setUser(u);

      if (u) {
        const { data: p } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", u.id)
          .single();

        setProfile(p || null);
      }
    }

    load();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const isPro = profile?.plan === "pro";

  return (
    <HeaderStructure
      logoUrl={logoUrl}
      bannerUrl={bannerUrl}
      logo_x={logo_x}
      logo_y={logo_y}
      logo_scale={logo_scale}
      logo_rotation={logo_rotation}
      banner_offset_x={banner_offset_x}
      banner_offset_y={banner_offset_y}
      banner_scale={banner_scale}
      banner_rotation={banner_rotation}
      brand={brand}
      navItems={navItems}
      userPresent={!!user}
      isPro={!!isPro}
      isAdmin={!!isAdmin}
      onLogout={logout}
    />
  );
}
