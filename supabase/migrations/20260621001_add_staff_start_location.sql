-- Each staff member now declares whether their working day starts/ends at
-- their home postcode or at the office postcode, instead of the scheduler
-- always assuming office.
alter table staff add column if not exists start_location text not null default 'office';

alter table staff drop constraint if exists staff_start_location_check;
alter table staff add constraint staff_start_location_check check (start_location in ('home', 'office'));
