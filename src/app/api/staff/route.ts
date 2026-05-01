import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  // Fetch staff
  const { data, error } = await supabase
    .from("staff")
    .select(`
      id,
      name,
      home_lat,
      home_lng
    `)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Staff API error:", error);
    return NextResponse.json(
      { error: "Failed to load staff" },
      { status: 500 }
    );
  }

  // Clean + normalize shape
  const cleaned = (data ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    home_lat: s.home_lat,
    home_lng: s.home_lng,
  }));

  return NextResponse.json(cleaned);
}
