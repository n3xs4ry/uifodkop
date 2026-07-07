alter table public.subscriptions
add column if not exists currency text not null default 'KZT';

alter table public.subscriptions
drop constraint if exists subscriptions_currency_check;

alter table public.subscriptions
add constraint subscriptions_currency_check
check (currency in ('KZT', 'USD', 'EUR', 'GBP', 'TRY', 'RUB'));
