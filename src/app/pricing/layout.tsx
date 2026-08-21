import type { Metadata } from "next";
import type { ReactNode } from "react";

const DESCRIPTION =
  "Free to start, no sign-up. Pro adds unlimited staff, recurring visits and the calendar. Your client data stays in your browser on every plan.";

export const metadata: Metadata = {
  title: "Pricing",
  description: DESCRIPTION,
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Pricing – GeoRoutes",
    description: DESCRIPTION,
    url: "/pricing",
  },
};

export default function PricingLayout({ children }: { children: ReactNode }) {
  return children;
}
