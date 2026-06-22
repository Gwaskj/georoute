-- Per-user custom scheduling windows
create table if not exists user_windows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  local_id text not null,
  name text not null,
  start_time text not null,
  end_time text not null,
  min_gap_to_next integer not null default 0
);

create index if not exists user_windows_user_id_idx on user_windows(user_id);

-- Per-user skills list
create table if not exists user_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  local_id text not null,
  name text not null
);

create index if not exists user_skills_user_id_idx on user_skills(user_id);

-- RLS
alter table user_windows enable row level security;
create policy "Users manage own windows"
  on user_windows for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table user_skills enable row level security;
create policy "Users manage own skills"
  on user_skills for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
