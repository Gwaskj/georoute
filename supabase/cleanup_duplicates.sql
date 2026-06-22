-- ============================================================
-- GeoRoute: Clean up duplicate rows caused by DELETE+INSERT race
-- Run once in the Supabase SQL Editor after applying the code fix.
-- Safe to run on live data — keeps one row per (user_id, local_id).
-- ============================================================

-- Appointments
DELETE FROM public.appointments
WHERE ctid NOT IN (
  SELECT MIN(ctid)
  FROM public.appointments
  GROUP BY user_id, local_id
);

-- Staff
DELETE FROM public.staff
WHERE ctid NOT IN (
  SELECT MIN(ctid)
  FROM public.staff
  GROUP BY user_id, local_id
);

-- Time windows (dedup by name — seeding creates new UUIDs each run)
DELETE FROM public.user_windows
WHERE ctid NOT IN (
  SELECT MIN(ctid)
  FROM public.user_windows
  GROUP BY user_id, name
);

-- Skills
DELETE FROM public.user_skills
WHERE ctid NOT IN (
  SELECT MIN(ctid)
  FROM public.user_skills
  GROUP BY user_id, local_id
);

SELECT
  (SELECT COUNT(*) FROM public.appointments)  AS appointments,
  (SELECT COUNT(*) FROM public.staff)         AS staff,
  (SELECT COUNT(*) FROM public.user_windows)  AS windows,
  (SELECT COUNT(*) FROM public.user_skills)   AS skills;
