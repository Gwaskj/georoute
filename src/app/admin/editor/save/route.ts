import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function POST(req: Request) {
  const body = await req.json();

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
          // Route Handlers cannot modify cookies
        },
        remove() {
          // Route Handlers cannot modify cookies
        },
      },
    }
  );

  await supabase.from("layouts").upsert(body);

  return NextResponse.json({ ok: true });
}
