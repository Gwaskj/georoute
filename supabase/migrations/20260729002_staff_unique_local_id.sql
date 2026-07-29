-- Unique key for upserting staff, so saving can write before it deletes.
--
-- persistPro previously cleared a user's staff and then re-inserted them. Any
-- failure between those two steps -- a missing column, a constraint, a dropped
-- connection -- left the user with no staff at all. Without a unique key there
-- was no way to upsert instead.
--
-- Partial, because local_id defaults to '' and older rows may not have one;
-- those cannot participate in the upsert but must not block the index either.
create unique index if not exists staff_user_local_id_idx
  on public.staff (user_id, local_id)
  where local_id is not null and local_id <> '';
