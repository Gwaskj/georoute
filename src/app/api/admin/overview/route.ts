import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/** An item needing attention, rather than a number to look at. */
interface Issue {
  id: string;
  severity: "warn" | "info";
  title: string;
  detail: string;
  /** Where to go to deal with it, when there is somewhere. */
  href?: string;
}

/**
 * Everything the dashboard shows, in one request.
 *
 * Aggregated server-side with the service role rather than queried from the
 * browser: the counts span every user's rows, which RLS deliberately hides
 * from a client, and doing it here means no raw personal data is sent to the
 * page at all -- only totals and the last few log entries.
 */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: me } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!me?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = serviceClient();
  const now = Date.now();
  const daysAgo = (n: number) => new Date(now - n * 86400000).toISOString();

  // Staff, appointments, routes and share links are no longer read here --
  // the tables are gone, and this dashboard was listing client names and
  // postcodes back at an admin, which is precisely the custody the product
  // now avoids. What is left is account and billing health, which is our own
  // data about our own customers.
  const [profilesRes, logsRes] = await Promise.all([
    db.from("profiles").select("user_id, email, is_pro, is_admin, plan, owner_user_id, stripe_customer_id, stripe_subscription_id, subscription_renewal, pro_ended_at, created_at"),
    db.from("activity_logs").select("id, action, details, created_at, actor_id").order("created_at", { ascending: false }).limit(400),
  ]);

  const profiles = profilesRes.data ?? [];
  const logs = logsRes.data ?? [];

  // Owners only -- staff logins are not customers and would inflate every count.
  const owners = profiles.filter((p) => !p.owner_user_id);
  const staffAccounts = profiles.filter((p) => p.owner_user_id);

  const since7 = daysAgo(7);
  const since30 = daysAgo(30);

  const actionCounts: Record<string, number> = {};
  for (const l of logs) actionCounts[l.action] = (actionCounts[l.action] ?? 0) + 1;

  const issues: Issue[] = [];

  // The exact shape of the bug that made payments silently fail: marked pro,
  // has a Stripe customer, but no subscription ever synced back.
  const proWithoutSub = owners.filter(
    (p) => p.is_pro && p.stripe_customer_id && !p.stripe_subscription_id
  );
  if (proWithoutSub.length > 0) {
    issues.push({
      id: "pro-no-sub",
      severity: "warn",
      title: `${proWithoutSub.length} Pro account${proWithoutSub.length === 1 ? "" : "s"} with no subscription recorded`,
      detail:
        "Marked Pro with a Stripe customer but no stripe_subscription_id. Either it was granted manually, or a webhook did not land.",
      href: "/admin/users",
    });
  }

  const proNoRenewal = owners.filter((p) => p.is_pro && !p.subscription_renewal);
  if (proNoRenewal.length > 0) {
    issues.push({
      id: "pro-no-renewal",
      severity: "info",
      title: `${proNoRenewal.length} Pro account${proNoRenewal.length === 1 ? "" : "s"} with no renewal date`,
      detail: "Expected for manually granted accounts; unexpected after a real payment.",
      href: "/admin/users",
    });
  }

  const routingErrors = logs.filter(
    (l) => l.action === "routing_error" && l.created_at >= since7
  );
  if (routingErrors.length > 0) {
    issues.push({
      id: "routing-errors",
      severity: "warn",
      title: `${routingErrors.length} routing failure${routingErrors.length === 1 ? "" : "s"} in the last 7 days`,
      detail: "Travel times could not be fetched. Usually a bad postcode, sometimes the routing service.",
      href: "/admin/logs",
    });
  }

  const genFailures = logs.filter(
    (l) => l.action === "schedule_generation_failed" && l.created_at >= since30
  );
  if (genFailures.length > 0) {
    issues.push({
      id: "generation-failures",
      severity: "warn",
      title: `${genFailures.length} schedule generation${genFailures.length === 1 ? "" : "s"} failed in 30 days`,
      detail: "The engine threw rather than returning warnings. Worth reading the log detail.",
      href: "/admin/logs",
    });
  }

  // Carer logins were removed along with the staff-accounts API. Any profile
  // still carrying an owner_user_id is a leftover from before that, with no
  // route left to manage it -- so it surfaces here rather than sitting
  // invisible in the auth table.
  if (staffAccounts.length > 0) {
    issues.push({
      id: "orphaned-staff-logins",
      severity: "warn",
      title: `${staffAccounts.length} carer login${staffAccounts.length === 1 ? "" : "s"} left over from staff accounts`,
      detail:
        "Staff logins no longer exist; carers get a per-day round link instead. These accounts can no longer sign in to anything useful and should be deleted in Supabase under Authentication → Users.",
      href: "/admin/users",
    });
  }

  const pendingPurge = owners.filter(
    (p) => p.pro_ended_at && !p.is_pro && p.pro_ended_at > daysAgo(30)
  );
  if (pendingPurge.length > 0) {
    issues.push({
      id: "pending-purge",
      severity: "info",
      title: `${pendingPurge.length} cancelled account${pendingPurge.length === 1 ? "" : "s"} inside the 30-day retention window`,
      detail: "Data is still restorable. It is deleted automatically once 30 days have passed.",
    });
  }

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    totals: {
      owners: owners.length,
      pro: owners.filter((p) => p.is_pro).length,
      free: owners.filter((p) => !p.is_pro).length,
      admins: owners.filter((p) => p.is_admin).length,
      staffAccounts: staffAccounts.length,
    },
    recent: {
      newOwners7: owners.filter((p) => p.created_at >= since7).length,
      newOwners30: owners.filter((p) => p.created_at >= since30).length,
      schedules7: logs.filter(
        (l) => l.action === "schedule_generated" && l.created_at >= since7
      ).length,
      schedules30: logs.filter(
        (l) => l.action === "schedule_generated" && l.created_at >= since30
      ).length,
    },
    actionCounts,
    issues,
    activity: logs.slice(0, 15).map((l) => ({
      id: l.id,
      action: l.action,
      created_at: l.created_at,
      // Kept short: the dashboard is a summary, and the logs page has the rest.
      detail:
        l.details && typeof l.details === "object"
          ? JSON.stringify(l.details).slice(0, 140)
          : null,
    })),
  });
}
