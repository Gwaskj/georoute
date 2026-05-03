import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function GET() {
  // IMPORTANT: cookies() returns a Promise in your environment
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

  const { data, error } = await supabase.from("staff").select("*");

  return NextResponse.json({ data, error });
}
