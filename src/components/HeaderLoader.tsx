import Header from "./Header";

export default async function HeaderLoader() {
  // Fetch header config directly from Supabase REST API
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/site_header?id=eq.1&select=*`,
    {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      cache: "no-store", // ensures header updates instantly
    }
  );

  const data = await res.json();
  const row = data?.[0] || {};

  return (
    <Header
      title={row.title || null}
      logoUrl={row.logo_url || null}
      bannerUrl={row.banner_url || null}
      logo_x={row.logo_x ?? 0}
      logo_y={row.logo_y ?? 0}
      logo_scale={row.logo_scale ?? 1}
      banner_offset_x={row.banner_offset_x ?? 0}
      banner_offset_y={row.banner_offset_y ?? 0}
    />
  );
}
