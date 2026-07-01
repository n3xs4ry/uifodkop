create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  expiration_time timestamptz,
  user_agent text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create policy "read own push subscriptions"
  on public.push_subscriptions for select
  using (auth.uid() = user_id);

create policy "insert own push subscriptions"
  on public.push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "update own push subscriptions"
  on public.push_subscriptions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "delete own push subscriptions"
  on public.push_subscriptions for delete
  using (auth.uid() = user_id);

create table if not exists public.push_notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subscription_id uuid not null references public.subscriptions (id) on delete cascade,
  charge_date date not null,
  sent_at timestamptz not null default now(),
  unique (user_id, subscription_id, charge_date)
);

alter table public.push_notification_deliveries enable row level security;

create policy "read own push notification deliveries"
  on public.push_notification_deliveries for select
  using (auth.uid() = user_id);
