import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';

export default async function proxy(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );

  const { data } = await supabase.auth.getUser();
  const user = data.user;

  const pathname = req.nextUrl.pathname;

  // Protect /app/*
  if (pathname.startsWith('/app') && !user) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return Response.redirect(loginUrl);
  }

  // In Proxy API, this is how you "continue"
  return req;
}
