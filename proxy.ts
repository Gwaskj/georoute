import { createServerClient } from "@supabase/ssr";

export const proxy = async (request: Request) => {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Only protect /app/*
  if (!pathname.startsWith("/app")) {
    return undefined;
  }

  // Manual cookie parsing (Proxy API requirement)
  const cookieHeader = request.headers.get("cookie") || "";
  const getCookie = (name: string) => {
    const match = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(name + "="));

    return match ? match.split("=")[1] : undefined;
  };

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: getCookie,
      },
    }
  );

  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return Response.redirect(loginUrl);
  }

  return undefined; // allow request
};
