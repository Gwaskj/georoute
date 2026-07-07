import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Pricing",
  description: "GeoRoute is free to start. Upgrade to Pro for cloud storage, higher limits, and team features. Simple monthly pricing with no hidden fees.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Pricing – GeoRoute",
    description: "GeoRoute is free to start. Upgrade to Pro for cloud storage, higher limits, and team features. Simple monthly pricing with no hidden fees.",
    url: "/pricing",
  },
};

export default function PricingLayout({ children }: { children: ReactNode }) {
  return children;
}
