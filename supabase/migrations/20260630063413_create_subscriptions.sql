create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  cost numeric(10, 2) not null check (cost >= 0),
  charge_date date not null,
  created_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "read own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "insert own subscriptions"
  on public.subscriptions for insert
  with check (auth.uid() = user_id);

create policy "update own subscriptions"
  on public.subscriptions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "delete own subscriptions"
  on public.subscriptions for delete
  using (auth.uid() = user_id);
