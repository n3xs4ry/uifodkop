create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  reminder_days integer[] not null default array[1, 0],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_preferences_days_check
    check (reminder_days <@ array[0, 1, 2] and cardinality(reminder_days) between 1 and 3)
);

alter table public.notification_preferences enable row level security;

create policy "read own notification preferences"
  on public.notification_preferences for select
  using (auth.uid() = user_id);

create policy "insert own notification preferences"
  on public.notification_preferences for insert
  with check (auth.uid() = user_id);

create policy "update own notification preferences"
  on public.notification_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.push_notification_deliveries
  add column if not exists days_before integer not null default 0;

alter table public.telegram_notification_deliveries
  add column if not exists days_before integer not null default 1;

alter table public.push_notification_deliveries
  drop constraint if exists push_notification_deliveries_user_id_subscription_id_charge_date_key;

alter table public.telegram_notification_deliveries
  drop constraint if exists telegram_notification_deliveries_user_id_subscription_id_charge_date_key;

create unique index if not exists push_notification_deliveries_unique_reminder_idx
  on public.push_notification_deliveries (user_id, subscription_id, charge_date, days_before);

create unique index if not exists telegram_notification_deliveries_unique_reminder_idx
  on public.telegram_notification_deliveries (user_id, subscription_id, charge_date, days_before);
