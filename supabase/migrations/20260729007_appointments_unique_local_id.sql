-- Same fix as staff_user_local_id_idx, for the same reason.
--
-- persistPro on appointments also deletes every row for the user and then
-- re-inserts. Any failure in between loses the whole list, and the risk rises
-- the moment new columns are added to that insert -- which the recurrence work
-- does. Upserting instead needs a unique key.
--
-- Partial, because local_id is nullable on this table; rows without one cannot
-- take part in the upsert but must not block the index.
create unique index if not exists appointments_user_local_id_idx
  on public.appointments (user_id, local_id)
  where local_id is not null and local_id <> '';
