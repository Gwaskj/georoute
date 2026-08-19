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
/**
 * Paths reserved for the account owner.
 *
 * This list is back, and this time it is load-bearing rather than the inert
 * duplicate that was removed before: the matcher below now has to cover every
 * route so the apex redirect can run, so the middleware itself has to decide
 * which of those routes warrant the profile lookup.
 */
const OWNER_ONLY = [
  "/scheduler",
  "/staff",
  "/settings",
  "/account",
  "/calendar",
  "/admin",
];

export async function middleware(req: NextRequest) {
  // Apex to www, before anything else and before any database call.
  //
  // This belongs in next.config.js as a `has: [{ type: "host" }]` redirect,
  // and it is written that way on Vercel. On the Cloudflare adapter that rule
  // misbehaves in two directions at once: it fails to substitute :path* into
  // the destination, and it matches www as well as the apex -- which redirects
  // www to itself, an infinite loop that takes the whole site down. Verified
  // against both runtimes with the identical config.
  // Plain HTTP was being served with a 200 rather than redirected. Vercel
  // upgraded it automatically; Cloudflare will too once "Always Use HTTPS" is
  // switched on for the zone, but that is a dashboard setting and this is not,
  // so the guarantee travels with the application.
  //
  // Only acts when the proxy explicitly reports http. Inferring from req.url
  // would be wrong behind a TLS-terminating proxy, where the worker sees a
  // plain-http URL for a request the visitor made over https -- and redirecting
  // those to https would loop forever.
  const host = req.headers.get("host")?.split(":")[0].toLowerCase();

  // Loopback is exempt. `next start` sets x-forwarded-proto: http on a plain
  // local connection, so without this the upgrade fires on localhost and sends
  // the browser to an https://localhost that nothing is listening on -- which
  // made the app impossible to run or end-to-end test locally, and is why the
  // suite had only ever been pointed at production.
  const isLoopback = host === "localhost" || host === "127.0.0.1" || host === "[::1]";

  const proto = req.headers.get("x-forwarded-proto");
  if (proto === "http" && !isLoopback) {
    const url = new URL(req.url);
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }

  if (host === "georoutes.co.uk") {
    const url = new URL(req.url);
    url.protocol = "https:";
    url.host = "www.georoutes.co.uk";
    return NextResponse.redirect(url, 308);
  }

  // Everything below is the owner-only guard, which most requests skip. The
  // matcher covers the whole site for the redirect above, so without this the
  // Supabase lookup would run on every page load and every asset request.
  const path = req.nextUrl.pathname;
  const isOwnerOnly = OWNER_ONLY.some(
    (p) => path === p || path.startsWith(`${p}/`)
  );
  if (!isOwnerOnly) return NextResponse.next();

  const isAdminPath = path === "/admin" || path.startsWith("/admin/");

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

  // Signed out is not this guard's business for the owner's own pages -- they
  // handle it themselves, and redirecting here would break the login flow.
  // Admin pages are different: there is no signed-out view of them worth
  // serving, and letting the request through was how a logged-out visitor
  // received the admin navigation and, on two pages, a working screen.
  if (!user) {
    return isAdminPath ? NextResponse.redirect(new URL("/", req.url)) : res;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("owner_user_id, is_admin")
    .eq("user_id", user.id)
    .maybeSingle();

  // owner_user_id set is what marks an account as staff.
  if (profile?.owner_user_id) {
    return NextResponse.redirect(new URL("/my-round", req.url));
  }

  // Admin pages are refused here, before the page renders at all.
  //
  // Each admin page also checks for itself, but those checks run in the
  // browser after the component has mounted -- so the page and its navigation
  // were served to anyone who asked, and two of them rendered a usable screen
  // rather than a refusal. Deciding it server-side means a non-admin never
  // receives the markup in the first place.
  //
  // Redirected home rather than shown a refusal: there is nothing an ordinary
  // account can do about it, and confirming that a page exists is more than
  // they need to know.
  if (isAdminPath && !profile?.is_admin) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return res;
}

/**
 * Every route except build output and files with an extension.
 *
 * Wider than it needs to be for the owner-only guard, because the apex-to-www
 * redirect has to see requests for every page. The guard itself is gated in
 * code by OWNER_ONLY, so the cost of the broader matcher is a hostname
 * comparison rather than a database call.
 */
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.[^/]+$).*)"],
};
