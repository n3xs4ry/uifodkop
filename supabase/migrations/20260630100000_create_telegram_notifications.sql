create table if not exists public.telegram_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  connect_token text not null unique,
  chat_id text,
  chat_title text,
  is_active boolean not null default false,
  connected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists telegram_connections_active_chat_id_idx
  on public.telegram_connections (chat_id)
  where chat_id is not null and is_active = true;

create unique index if not exists telegram_connections_active_user_id_idx
  on public.telegram_connections (user_id)
  where is_active = true;

alter table public.telegram_connections enable row level security;

create policy "read own telegram connections"
  on public.telegram_connections for select
  using (auth.uid() = user_id);

create policy "insert own telegram connections"
  on public.telegram_connections for insert
  with check (auth.uid() = user_id);

create policy "update own telegram connections"
  on public.telegram_connections for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "delete own telegram connections"
  on public.telegram_connections for delete
  using (auth.uid() = user_id);

create table if not exists public.telegram_notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subscription_id uuid not null references public.subscriptions (id) on delete cascade,
  charge_date date not null,
  sent_at timestamptz not null default now(),
  unique (user_id, subscription_id, charge_date)
);

alter table public.telegram_notification_deliveries enable row level security;

create policy "read own telegram notification deliveries"
  on public.telegram_notification_deliveries for select
  using (auth.uid() = user_id);
