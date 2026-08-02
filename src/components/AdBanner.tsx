"use client";

import { useEffect } from "react";
import Script from "next/script";

type AdBannerProps = {
  className?: string;
};

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export default function AdBanner({ className }: AdBannerProps) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className={className}>
      {/* Loaded here rather than in the root layout: AdSense should not be
          requested on pages that show no ads, and several pages on this site
          (login, signup, feedback) have little content by nature. */}
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1904838490296389"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
      <ins
        className="adsbygoogle block w-full"
        style={{ display: "block" }}
        data-ad-client="ca-pub-1904838490296389"
        data-ad-slot="6104460687"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
