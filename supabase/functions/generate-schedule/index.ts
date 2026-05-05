// @ts-ignore: Deno remote import
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// @ts-ignore: Deno remote import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  try {
    const { user_id, date } = await req.json();

    // @ts-ignore: Deno global
    const supabase = createClient(
      // @ts-ignore: Deno global
      Deno.env.get("SUPABASE_URL")!,
      // @ts-ignore: Deno global
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: routes } = await supabase
      .from("routes")
      .select("*")
      .eq("user_id", user_id)
      .eq("date", date);

    if (!routes || routes.length === 0) {
      return new Response(
        JSON.stringify({ error: "No routes found" }),
        { status: 404 }
      );
    }

    const schedule = routes.map((r: any) => ({
      route_id: r.id,
      start_time: "09:00",
      end_time: "17:00",
      stops: r.stops || [],
    }));

    return new Response(JSON.stringify({ schedule }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    const error = err as Error;
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
});
