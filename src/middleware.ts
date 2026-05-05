import { NextResponse, NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
      },
    }
  );

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_pro")
    .single();

  const paidRoutes = ["/admin", "/scheduler", "/engine"];

  if (paidRoutes.some((r) => req.nextUrl.pathname.startsWith(r))) {
    if (!profile?.is_pro) {
      return NextResponse.redirect(new URL("/pricing", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/scheduler/:path*", "/engine/:path*"],
};
