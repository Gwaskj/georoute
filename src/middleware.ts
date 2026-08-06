import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Keep staff accounts out of the owner's tools.
 *
 * A staff login is read-only at the database level -- writes are refused by a
 * trigger, and RLS shows it only the rounds published to it. But it could
 * still open /scheduler, /staff and /settings and be shown an empty version of
 * a workspace it has no business seeing, which is confusing and not what
 * "read only their own schedule" implies.
 *
 * Done in middleware rather than per page because two of these are client
 * components, where a redirect can only happen after the page has already
 * rendered and its data has been fetched. It also means a page added later is
 * covered without anyone remembering to guard it.
 *
 * The list of protected routes lives in `config.matcher` at the foot of this
 * file and nowhere else. Next.js reads that matcher statically at build time,
 * so it cannot be built from a constant -- and a second copy of the list up
 * here would be inert, which is worse than no copy: adding a route to it would
 * look like protection while doing nothing at all.
 */
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookies) => {
          for (const { name, value, options } of cookies) {
            res.cookies.set({ name, value, ...options });
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Signed out is not this guard's business -- the pages handle that
  // themselves, and redirecting here would break the login flow.
  if (!user) return res;

  const { data: profile } = await supabase
    .from("profiles")
    .select("owner_user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  // owner_user_id set is what marks an account as staff.
  if (profile?.owner_user_id) {
    return NextResponse.redirect(new URL("/my-round", req.url));
  }

  return res;
}

// Only the owner-only routes, so no other request pays for the profile lookup.
export const config = {
  matcher: [
    "/scheduler/:path*",
    "/staff/:path*",
    "/settings/:path*",
    "/account/:path*",
    "/calendar/:path*",
    "/admin/:path*",
  ],
};
