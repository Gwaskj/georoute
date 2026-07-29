import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/**
 * Create a read-only login for one of the caller's staff members.
 *
 * The owner sets the initial password and passes it on directly, so this needs
 * no email delivery -- which matters because Supabase's built-in SMTP is rate
 * limited to a handful of messages an hour and would make onboarding a whole
 * team painful.
 */
export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // A staff account must not be able to create further staff accounts.
  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("owner_user_id, is_pro")
    .eq("user_id", user.id)
    .maybeSingle();

  if (callerProfile?.owner_user_id) {
    return NextResponse.json({ error: "Staff accounts are read-only" }, { status: 403 });
  }
  if (!callerProfile?.is_pro) {
    return NextResponse.json(
      { error: "Staff logins are a Pro feature." },
      { status: 403 }
    );
  }

  let body: { staffLocalId?: string; email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const staffLocalId = body.staffLocalId?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!staffLocalId) {
    return NextResponse.json({ error: "staffLocalId is required" }, { status: 400 });
  }
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }
  if (password.length < 10) {
    return NextResponse.json(
      { error: "Password must be at least 10 characters" },
      { status: 400 }
    );
  }

  const admin = serviceClient();

  // The staff row must belong to the caller. Checked against the caller's own
  // rows rather than trusting staffLocalId, so an owner cannot attach a login
  // to somebody else's staff member.
  const { data: staffRow } = await admin
    .from("staff")
    .select("id, name, auth_user_id")
    .eq("user_id", user.id)
    .eq("local_id", staffLocalId)
    .maybeSingle();

  if (!staffRow) {
    return NextResponse.json({ error: "No such staff member" }, { status: 404 });
  }
  if (staffRow.auth_user_id) {
    return NextResponse.json(
      { error: "That staff member already has a login." },
      { status: 409 }
    );
  }

  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // no verification mail to send or wait on
      user_metadata: { full_name: staffRow.name },
    });

  if (createError || !created?.user) {
    return NextResponse.json(
      { error: createError?.message ?? "Could not create login" },
      { status: 400 }
    );
  }

  const staffUserId = created.user.id;

  // Mark it as a staff account. This is what the read-only enforcement keys
  // off, so an account that is not marked is not restricted -- it must be
  // verified rather than assumed.
  //
  // The row is created by the handle_new_user trigger, so an update can
  // legitimately race it and match zero rows while returning no error. The
  // returned representation is checked for that reason; upsert covers the case
  // where the row genuinely is not there yet.
  const { data: profileRows, error: profileError } = await admin
    .from("profiles")
    .upsert(
      { user_id: staffUserId, email, owner_user_id: user.id },
      { onConflict: "user_id" }
    )
    .select("user_id, owner_user_id");

  if (profileError || profileRows?.[0]?.owner_user_id !== user.id) {
    // Never leave an unmarked account behind: it would be able to write.
    await admin.auth.admin.deleteUser(staffUserId);
    return NextResponse.json(
      { error: "Could not finish setting up the login" },
      { status: 500 }
    );
  }

  const { error: linkError } = await admin
    .from("staff")
    .update({ auth_user_id: staffUserId })
    .eq("id", staffRow.id);

  if (linkError) {
    await admin.auth.admin.deleteUser(staffUserId);
    return NextResponse.json(
      { error: "Could not link the login to that staff member" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, email });
}

/** Remove a staff login. The staff member and their rounds are untouched. */
export async function DELETE(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const staffLocalId = searchParams.get("staffLocalId");

  if (!staffLocalId) {
    return NextResponse.json({ error: "staffLocalId is required" }, { status: 400 });
  }

  const admin = serviceClient();

  const { data: staffRow } = await admin
    .from("staff")
    .select("id, auth_user_id")
    .eq("user_id", user.id)
    .eq("local_id", staffLocalId)
    .maybeSingle();

  if (!staffRow?.auth_user_id) {
    return NextResponse.json({ error: "No login for that staff member" }, { status: 404 });
  }

  await admin.from("staff").update({ auth_user_id: null }).eq("id", staffRow.id);
  await admin.auth.admin.deleteUser(staffRow.auth_user_id);

  return NextResponse.json({ ok: true });
}
