"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function Header() {
  const supabase = createSupabaseBrowserClient();

  const [header, setHeader] = useState<{
    title: string;
    logo_url: string;
  }>({
    title: "GeoRoute",
    logo_url: "/logo-placeholder.png",
  });

  useEffect(() => {
    async function loadHeader() {
      const { data } = await supabase
        .from("site_header")
        .select("*")
        .single();

      if (data) {
        setHeader({
          title: data.title || "GeoRoute",
          logo_url: data.logo_url || "/logo-placeholder.png",
        });
      }
    }

    loadHeader();
  }, [supabase]);

  return (
    <header className="w-full bg-white shadow-sm">
      <div className="max-w-6xl mx-auto flex items-center gap-4 px-6 py-4">
        <Image
          src={header.logo_url}
          alt="Logo"
          width={50}
          height={50}
          className="object-contain"
        />

        <h1 className="text-2xl font-bold text-gray-900">{header.title}</h1>
      </div>
    </header>
  );
}
