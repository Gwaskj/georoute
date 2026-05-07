"use client";

import "@/styles/header.css";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/supabase/supabaseClient";

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

export default function Header(props: HeaderProps) {
  const [loaded, setLoaded] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 150);

    async function loadUser() {
      const { data: userData } = await supabase.auth.getUser();
      const u = userData?.user || null;
      setUser(u);

      if (u) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("is_pro, subscription_renewal")
          .eq("user_id", u.id)
          .single();

        setProfile(profileData);
      }
    }

    loadUser();
    return () => clearTimeout(t);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  async function openBillingPortal() {
    if (!user) return;

    // Get the user's access token
    const { data: session } = await supabase.auth.getSession();
    const accessToken = session?.session?.access_token;
    if (!accessToken) {
      console.error("No access token found");
      return;
    }

    // Call the Supabase Edge Function
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-portal-session`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ user_id: user.id }),
      }
    );

    const json = await res.json();
    if (json.url) {
      window.location.href = json.url;
    } else {
      console.error("Billing portal error:", json);
    }
  }

  const safeTitle = props.title || "GeoRoute";
  const safeLogo = props.logoUrl || "/logo-placeholder.png";
  const safeBanner = props.bannerUrl || "/Banner-placeholder.jpg";

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
        backgroundPosition: `${props.banner_offset_x}px ${props.banner_offset_y}px`,
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
          transform: `translate(${props.logo_x}px, ${props.logo_y}px) scale(${props.logo_scale})`,
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
        {!user && <Link href="/login">Login</Link>}
      </nav>

      {user && (
        <div
          style={{
            marginLeft: 20,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span
            style={{
              padding: "4px 10px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              background: profile?.is_pro ? "#22c55e" : "#fbbf24",
              color: "#000",
            }}
          >
            {profile?.is_pro ? "Pro" : "Free"}
          </span>

          {profile?.is_pro && profile.subscription_renewal && (
            <span
              style={{
                fontSize: 12,
                color: "#fff",
                opacity: 0.8,
              }}
            >
              Renews:{" "}
              {new Date(profile.subscription_renewal).toLocaleDateString()}
            </span>
          )}

          {profile?.is_pro && (
            <button
              onClick={openBillingPortal}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                background: "#14b8a6",
                color: "#000",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Manage Billing
            </button>
          )}

          <button
            onClick={handleLogout}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              background: "#ef4444",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
}
