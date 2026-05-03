export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { ReactNode } from "react";
import "../globals.css";
import "leaflet/dist/leaflet.css";
import ClientBoundary from "./ClientBoundary";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Allow everything in dev so you never get locked out
  if (process.env.NODE_ENV === "development") {
    return <ClientBoundary>{children}</ClientBoundary>;
  }

  // In your environment, cookies() returns a Promise
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {
          // Layouts cannot modify cookies during SSR
        },
        remove() {
          // Same restriction
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: adminRecord } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminRecord) redirect("/");

  return <ClientBoundary>{children}</ClientBoundary>;
}
