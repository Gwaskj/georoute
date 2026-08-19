-- Drop business_settings, the last thing a customer typed that we still held.
--
-- It stored an office postcode and a working day. That is the customer's own
-- address rather than a client's, so it never made us a processor -- but with
-- everything around it local there was no reason left to keep it, and a table
-- of care providers' operating addresses is not a thing worth being the
-- custodian of.
--
-- It now lives in the same IndexedDB record as the staff and appointments, so
-- it survives a restart and travels with an export. A backup that restored
-- the rounds but not the office they start from would not be a backup.
--
-- Anything still in sessionStorage under the old key is adopted on first load
-- by settingsStore, so a customer mid-session does not find the field blank.

drop table if exists public.business_settings cascade;
