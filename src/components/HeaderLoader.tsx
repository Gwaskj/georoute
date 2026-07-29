import Header from "./Header";
import type { NavItem, BrandConfig } from "./HeaderStructure";

type Layout = {
  brand?: BrandConfig | null;
  navItems?: NavItem[] | null;
};

export default async function HeaderLoader() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/site_header?id=eq.1&select=*`,
    {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      cache: "no-store",
    }
  );

  const data = await res.json();
  const row = data?.[0] || {};

  const layout = (row.layout || {}) as Layout;

  const brand: BrandConfig = layout.brand ?? {
    enabled: true,
    text: "GeoRoutes",
  };

  const rawNavItems: NavItem[] =
    layout.navItems && Array.isArray(layout.navItems)
      ? layout.navItems
      : [
          // Inline: the places people go to do the job.
          { id: "scheduler", text: "Scheduler", href: "/scheduler", align: "right" },
          { id: "calendar", text: "Calendar", href: "/calendar", align: "right" },
          { id: "pricing", text: "Pricing", href: "/pricing", align: "right" },
          // In the dropdown: everything else, so the bar stays short as pages
          // are added rather than wrapping onto a second line.
          { id: "help", text: "Help", href: "/help", align: "right", inMenu: true },
          { id: "settings", text: "Settings", href: "/settings", align: "right", inMenu: true },
          { id: "account", text: "Account", href: "/account", align: "right", inMenu: true },
          { id: "feedback", text: "Feedback", href: "/feedback", align: "right", inMenu: true },
          { id: "admin", text: "Admin", href: "#", align: "right", isAdmin: true, inMenu: true },
        ];

  // The standalone Billing page was merged into /account — drop any
  // stale nav item still pointing at the old route.
  const navItems = rawNavItems.filter((n) => n.href !== "/account/billing");

  return (
    <Header
      logoUrl={row.logo_url || null}
      bannerUrl={row.banner_url || null}
      logo_x={row.logo_x ?? 0}
      logo_y={row.logo_y ?? 0}
      logo_scale={row.logo_scale ?? 1}
      logo_rotation={row.logo_rotation ?? 0}
      banner_offset_x={row.banner_offset_x ?? 0}
      banner_offset_y={row.banner_offset_y ?? 0}
      banner_scale={row.banner_scale ?? 1}
      banner_rotation={row.banner_rotation ?? 0}
      brand={brand}
      navItems={navItems}
    />
  );
}
