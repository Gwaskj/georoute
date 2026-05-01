// supabase/functions/generate-schedule/index.ts

// Deno / Supabase Edge Function
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type StaffRow = {
  id: string;
  name: string;
  home_lat: number | null;
  home_lng: number | null;
};

type ClientRow = {
  id: string;
  name: string;
  lat: number | null;
  lng: number | null;
};

type AppointmentRow = {
  id: string;
  start_time: string | null;
  end_time: string | null;
  staff_id: string | null;
  clients: ClientRow | null;
};

type GenerateScheduleRequest = {
  userId: string;
  isPaidUser: boolean;
};

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const orsApiKey = Deno.env.get("ORS_API_KEY");

    if (!supabaseUrl || !serviceKey || !orsApiKey) {
      console.error("Missing env vars");
      return new Response("Server misconfigured", { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const { userId, isPaidUser } =
      (await req.json()) as GenerateScheduleRequest;

    // 1. Load appointments + joined client
    const { data: appointmentsRaw, error: apptError } = await supabase
      .from("appointments")
      .select(
        `
        id,
        start_time,
        end_time,
        staff_id,
        clients:client_id (
          id,
          name,
          lat,
          lng
        )
      `
      );

    if (apptError) {
      console.error("appointments error", apptError);
      return new Response("Failed to load appointments", { status: 500 });
    }

    const appointments = (appointmentsRaw ?? []) as AppointmentRow[];

    // 2. Load staff
    const { data: staffRaw, error: staffError } = await supabase
      .from("staff")
      .select("id, name, home_lat, home_lng");

    if (staffError) {
      console.error("staff error", staffError);
      return new Response("Failed to load staff", { status: 500 });
    }

    let staff = (staffRaw ?? []) as StaffRow[];

    // 3. FREE USER LIMITS
    if (!isPaidUser) {
      // Limit staff to 2
      staff = staff.slice(0, 2);

      // Limit appointments to those belonging to the first 2 staff,
      // and max 10 per staff (so max 20 total)
      const allowedStaffIds = new Set(staff.map((s) => s.id));

      const perStaffCount: Record<string, number> = {};
      const limitedAppointments: AppointmentRow[] = [];

      for (const a of appointments) {
        if (!a.staff_id || !allowedStaffIds.has(a.staff_id)) continue;

        perStaffCount[a.staff_id] = (perStaffCount[a.staff_id] ?? 0) + 1;
        if (perStaffCount[a.staff_id] > 10) continue;

        limitedAppointments.push(a);
      }

      // Replace with limited set
      appointments.length = 0;
      appointments.push(...limitedAppointments);
    }

    // If nothing to route, short‑circuit
    if (appointments.length === 0 || staff.length === 0) {
      return json({
        status: "no-data",
        staff,
        appointments,
        routes: [],
      });
    }

    // 4. Build a simple hash for caching (paid users only)
    const hashInput = JSON.stringify({
      staff: staff.map((s) => ({
        id: s.id,
        home_lat: s.home_lat,
        home_lng: s.home_lng,
      })),
      appointments: appointments.map((a) => ({
        id: a.id,
        staff_id: a.staff_id,
        client_id: a.clients?.id ?? null,
      })),
    });

    const hash = await sha1(hashInput);

    // 5. PAID USERS: check cache
    if (isPaidUser) {
      const { data: cached, error: cacheError } = await supabase
        .from("route_cache")
        .select("routes")
        .eq("user_id", userId)
        .eq("hash", hash)
        .maybeSingle();

      if (cacheError) {
        console.error("cache error", cacheError);
      }

      if (cached?.routes) {
        return json({
          status: "cached",
          staff,
          appointments,
          routes: cached.routes,
        });
      }
    }

    // 6. Build ORS locations array
    // For simplicity: just use client locations; you can prepend staff homes if needed
    const locations = appointments
      .map((a) =>
        a.clients?.lat != null && a.clients?.lng != null
          ? [a.clients.lng, a.clients.lat]
          : null
      )
      .filter((p): p is [number, number] => p !== null);

    if (locations.length === 0) {
      return json({
        status: "no-locations",
        staff,
        appointments,
        routes: [],
      });
    }

    // 7. Call ORS matrix
    const orsMatrixRes = await fetch(
      "https://api.openrouteservice.org/v2/matrix/driving-car",
      {
        method: "POST",
        headers: {
          Authorization: orsApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locations,
          metrics: ["distance", "duration"],
        }),
      }
    );

    if (!orsMatrixRes.ok) {
      console.error("ORS matrix error", await orsMatrixRes.text());
      return new Response("ORS matrix failed", { status: 502 });
    }

    const orsMatrix = await orsMatrixRes.json();

    // 8. TODO: Replace this with your real optimisation logic
    const optimisedRoutes = {
      staff,
      appointments,
      matrix: orsMatrix,
    };

    // 9. PAID USERS: save cache
    if (isPaidUser) {
      const { error: insertError } = await supabase.from("route_cache").insert({
        user_id: userId,
        hash,
        routes: optimisedRoutes,
      });

      if (insertError) {
        console.error("cache insert error", insertError);
      }

      return json({
        status: "computed-paid",
        staff,
        appointments,
        routes: optimisedRoutes,
      });
    }

    // 10. FREE USERS: return result but do NOT write anything
    return json({
      status: "computed-free",
      staff,
      appointments,
      routes: optimisedRoutes,
    });
  } catch (err) {
    console.error("Unhandled error", err);
    return new Response("Internal error", { status: 500 });
  }
});

// Helpers

export function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

const sha1 = async (input: string): Promise<string> => {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};
