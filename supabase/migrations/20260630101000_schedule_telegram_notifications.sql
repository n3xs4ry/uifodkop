create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.unschedule('send-telegram-notifications-daily')
where exists (
  select 1
  from cron.job
  where jobname = 'send-telegram-notifications-daily'
);

select cron.schedule(
  'send-telegram-notifications-daily',
  '0 9 * * *',
  $$
  select net.http_post(
    url := 'https://mqxbdeqoszefhbonrand.supabase.co/functions/v1/send-telegram-notifications',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
