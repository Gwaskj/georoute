"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Navigation across the admin section.
 *
 * The admin pages previously had none: the only way between them was the
 * dropdown in the site header, which meant leaving whatever you were reading
 * to find it.
 */
const LINKS = [
  ["/admin", "Overview"],
  ["/admin/users", "Users"],
  ["/admin/schedule", "Schedule"],
  ["/admin/logs", "Logs"],
  ["/admin/pricing", "Pricing"],
  ["/admin/settings", "Settings"],
  ["/admin/header-editor", "Header"],
  ["/admin/themes", "Themes"],
  ["/admin/editor", "Pages"],
] as const;

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Admin"
      className="border-b border-slate-800 bg-slate-950/80"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-4 py-2">
        {LINKS.map(([href, label]) => {
          // Exact match for the overview, prefix for the rest -- otherwise
          // "/admin" would light up on every page in the section.
          const active =
            href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`rounded px-2.5 py-1 text-xs transition-colors ${
                active
                  ? "bg-teal-500/15 text-teal-200"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
