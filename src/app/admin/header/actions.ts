"use server";

import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

async function getSupabaseServer() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  );
}

export async function updateHeaderAction(formData: FormData) {
  const supabase = await getSupabaseServer();

  await supabase
    .from("site_header")
    .update({
      title: formData.get("title"),
      logo_url: formData.get("logoUrl"),
      banner_url: formData.get("bannerUrl"),
      logo_x: Number(formData.get("logo_x")),
      logo_y: Number(formData.get("logo_y")),
      logo_scale: Number(formData.get("logo_scale")),
      banner_offset_x: Number(formData.get("banner_offset_x")),
      banner_offset_y: Number(formData.get("banner_offset_y")),
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  revalidateTag("site_header", {});
}
