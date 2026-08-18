-- Stop holding data the product does not use.
--
-- date_of_birth was collected for every staff member and read by exactly one
-- thing: a line showing their age in the staff list. The scheduler never
-- touched it. A full date of birth is among the strongest identity-theft
-- fields there is, and it was being held to render a number beside a name.
--
-- notes was a free-text box on appointments that nothing read -- not the
-- scheduler, not the share links a carer receives. In practice it is where
-- "diabetic", "needs hoist", "dementia" would end up, which would make this
-- special category data under Article 9 and pull the whole system into a
-- materially stricter regime. Removing the box is cheaper than defending it.
--
-- Both are dropped rather than left unused: an unused column still has to be
-- disclosed, still appears in a breach, and still invites someone to populate
-- it later.
alter table public.staff        drop column if exists date_of_birth;
alter table public.appointments drop column if exists notes;
