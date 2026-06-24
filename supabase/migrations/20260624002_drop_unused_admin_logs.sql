-- admin_logs duplicated the schema of the old admin_activity_logs table
-- (see 20260624001) and was never written to by any code path — leftover
-- schema churn from the same disconnected logging effort. 0 rows in
-- production as of 2026-06-24. activity_logs / admin_activity_logs (view)
-- is now the single, actually-wired-up logging path.

drop table if exists public.admin_logs cascade;
