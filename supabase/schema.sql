create table if not exists schedule_data (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table schedule_data enable row level security;

create policy "Allow public read"
  on schedule_data for select
  using (true);

create policy "Allow public insert"
  on schedule_data for insert
  with check (true);

create policy "Allow public update"
  on schedule_data for update
  using (true);

alter publication supabase_realtime add table schedule_data;
