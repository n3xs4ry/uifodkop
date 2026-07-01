create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.unschedule('send-push-notifications-daily')
where exists (
  select 1
  from cron.job
  where jobname = 'send-push-notifications-daily'
);

select cron.schedule(
  'send-push-notifications-daily',
  '0 4 * * *',
  $$
  select net.http_post(
    url := 'https://mqxbdeqoszefhbonrand.supabase.co/functions/v1/send-push-notifications',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
