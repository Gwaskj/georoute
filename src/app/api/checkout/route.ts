import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { user_id } = await req.json();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-checkout`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id }),
    }
  );

  const data = await res.json();
  return NextResponse.json(data);
}
