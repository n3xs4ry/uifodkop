do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'push_notification_deliveries'
      and con.contype = 'u'
      and (
        select array_agg(att.attname::text order by att.attname::text)
        from unnest(con.conkey) key(attnum)
        join pg_attribute att on att.attrelid = con.conrelid and att.attnum = key.attnum
      ) = array['charge_date', 'subscription_id', 'user_id']
  loop
    execute format('alter table public.push_notification_deliveries drop constraint %I', constraint_name);
  end loop;

  for constraint_name in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'telegram_notification_deliveries'
      and con.contype = 'u'
      and (
        select array_agg(att.attname::text order by att.attname::text)
        from unnest(con.conkey) key(attnum)
        join pg_attribute att on att.attrelid = con.conrelid and att.attnum = key.attnum
      ) = array['charge_date', 'subscription_id', 'user_id']
  loop
    execute format('alter table public.telegram_notification_deliveries drop constraint %I', constraint_name);
  end loop;
end $$;
