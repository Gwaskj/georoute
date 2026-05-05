import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { unstable_cache } from "next/cache";

async function loadHeaderConfigRaw(cookieValues: Record<string, string | undefined>) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieValues[name],
        set: () => {},
        remove: () => {},
      },
    }
  );

  const { data } = await supabase
    .from("site_header")
    .select(
      `
      title,
      logo_url,
      banner_url,
      logo_x,
      logo_y,
      logo_scale,
      banner_offset_x,
      banner_offset_y
    `
    )
    .eq("id", 1)
    .single();

  return {
    title: data?.title || "GeoRoute",
    logo_url: data?.logo_url || "/logo-placeholder.png",
    banner_url: data?.banner_url || "/images/Header.jpg",
    logo_x: data?.logo_x ?? 0,
    logo_y: data?.logo_y ?? 0,
    logo_scale: data?.logo_scale ?? 1,
    banner_offset_x: data?.banner_offset_x ?? 0,
    banner_offset_y: data?.banner_offset_y ?? 0,
  };
}

export async function getHeaderConfig() {
  const cookieStore = await cookies();

  const cookieValues: Record<string, string | undefined> = {};
  cookieStore.getAll().forEach((c) => {
    cookieValues[c.name] = c.value;
  });

  const cached = unstable_cache(
    (cookieValues: Record<string, string | undefined>) =>
      loadHeaderConfigRaw(cookieValues),
    ["site_header_config"],
    { tags: ["site_header"] }
  );

  return cached(cookieValues);
}
