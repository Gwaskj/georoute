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

  const [profilesRes, staffRes, apptsRes, logsRes, sharesRes, routesRes] =
    await Promise.all([
      db.from("profiles").select("user_id, email, is_pro, is_admin, plan, owner_user_id, stripe_customer_id, stripe_subscription_id, subscription_renewal, pro_ended_at, created_at"),
      db.from("staff").select("id, user_id, name, home_postcode, office_postcode, auth_user_id"),
      db.from("appointments").select("id, user_id, name, postcode, archived, starts_on, recur_freq"),
      db.from("activity_logs").select("id, action, details, created_at, actor_id").order("created_at", { ascending: false }).limit(400),
      db.from("shared_schedules").select("id, expires_at, revoked, schedule_on"),
      db.from("routes").select("id, date"),
    ]);

  const profiles = profilesRes.data ?? [];
  const staff = staffRes.data ?? [];
  const appts = apptsRes.data ?? [];
  const logs = logsRes.data ?? [];
  const shares = sharesRes.data ?? [];
  const routes = routesRes.data ?? [];

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

  const noPostcodeAppts = appts.filter((a) => !a.archived && !a.postcode?.trim());
  if (noPostcodeAppts.length > 0) {
    issues.push({
      id: "appt-no-postcode",
      severity: "warn",
      title: `${noPostcodeAppts.length} appointment${noPostcodeAppts.length === 1 ? "" : "s"} with no postcode`,
      detail: "These cannot be routed and will be reported as unplaceable every time a schedule runs.",
    });
  }

  const noPostcodeStaff = staff.filter(
    (s) => !s.home_postcode?.trim() && !s.office_postcode?.trim()
  );
  if (noPostcodeStaff.length > 0) {
    issues.push({
      id: "staff-no-postcode",
      severity: "warn",
      title: `${noPostcodeStaff.length} staff member${noPostcodeStaff.length === 1 ? "" : "s"} with no start postcode`,
      detail: "Their day has no origin, so travel to their first visit cannot be calculated.",
    });
  }

  const expiringShares = shares.filter(
    (s) => !s.revoked && s.expires_at > new Date().toISOString() && s.expires_at < daysAgo(-3)
  );
  if (expiringShares.length > 0) {
    issues.push({
      id: "shares-expiring",
      severity: "info",
      title: `${expiringShares.length} share link${expiringShares.length === 1 ? "" : "s"} expiring within 3 days`,
      detail: "Staff holding these will lose access to their round.",
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
      staffRecords: staff.length,
      staffWithLogin: staff.filter((s) => s.auth_user_id).length,
      appointments: appts.filter((a) => !a.archived).length,
      archivedAppointments: appts.filter((a) => a.archived).length,
      recurring: appts.filter((a) => a.recur_freq && a.recur_freq !== "once").length,
      savedRoutes: routes.length,
      shareLinks: shares.length,
      activeShareLinks: shares.filter(
        (s) => !s.revoked && s.expires_at > new Date().toISOString()
      ).length,
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
