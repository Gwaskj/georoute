"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

interface HeaderProps {
  title: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  logo_x: number;
  logo_y: number;
  logo_scale: number;
  banner_offset_x: number;
  banner_offset_y: number;
}

export default function Header({
  title,
  logoUrl,
  bannerUrl,
  logo_x,
  logo_y,
  logo_scale,
  banner_offset_x,
  banner_offset_y,
}: HeaderProps) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 150);
    return () => clearTimeout(t);
  }, []);

  const safeTitle = title || "GeoRoute";
  const safeLogo = logoUrl || "/logo-placeholder.png";
  const safeBanner = bannerUrl || "/images/Header.jpg";

  if (!loaded) {
    return (
      <header
        style={{
          height: "90px",
          background: "#e5e7eb",
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
        }}
      />
    );
  }

  return (
    <header
      style={{
        position: "relative",
        backgroundImage: `url(${safeBanner})`,
        backgroundSize: "cover",
        backgroundPosition: `${banner_offset_x}px ${banner_offset_y}px`,
        height: "120px",
        display: "flex",
        alignItems: "center",
        paddingLeft: 20,
        paddingRight: 20,
      }}
    >
      <div
        style={{
          position: "relative",
          transform: `translate(${logo_x}px, ${logo_y}px) scale(${logo_scale})`,
          transformOrigin: "top left",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Image
          src={safeLogo}
          alt="Logo"
          width={70}
          height={70}
          style={{ objectFit: "contain" }}
        />
        <span style={{ fontSize: 24, fontWeight: 600 }}>{safeTitle}</span>
      </div>

      <nav style={{ marginLeft: "auto", display: "flex", gap: 16 }}>
        <Link href="/">Home</Link>
        <Link href="/scheduler">Scheduler</Link>
        <Link href="/login">Login</Link>
      </nav>
    </header>
  );
}
