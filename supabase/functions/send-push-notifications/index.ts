import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import webpush from 'npm:web-push@3.6.7';
import {
  configureWebPush,
  cors,
  createPushPayload,
  getSupabaseConfig,
  getWebPushStatusCode,
  todayInTimeZone,
  type DeliveryRow,
  type PushSubscriptionRow,
  type SubscriptionRow,
} from './helpers.ts';

const cronSecret = Deno.env.get('NOTIFICATIONS_CRON_SECRET');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    if (cronSecret && req.headers.get('x-cron-secret') !== cronSecret) {
      return json({ error: 'Forbidden' }, 403);
    }

    configureWebPush();
    const { supabaseUrl, serviceRoleKey } = getSupabaseConfig();
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const chargeDate = todayInTimeZone();
    const dueSubscriptions = await loadDueSubscriptions(supabase, chargeDate);
    const pendingSubscriptions = await filterPendingSubscriptions(supabase, dueSubscriptions, chargeDate);
    const devices = await loadUserDevices(
      supabase,
      [...new Set(pendingSubscriptions.map((item) => item.user_id))],
    );
    const sent = await sendNotifications(supabase, pendingSubscriptions, devices);

    return json({ chargeDate, sent });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...cors, 'Content-Type': 'application/json' },
    status,
  });
}

async function loadDueSubscriptions(supabase: ReturnType<typeof createClient>, chargeDate: string) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('id, user_id, name, cost, charge_date')
    .eq('charge_date', chargeDate);

  if (error) throw error;
  return (data ?? []) as SubscriptionRow[];
}

async function filterPendingSubscriptions(
  supabase: ReturnType<typeof createClient>,
  dueSubscriptions: SubscriptionRow[],
  chargeDate: string,
) {
  if (dueSubscriptions.length === 0) return [];

  const { data, error } = await supabase
    .from('push_notification_deliveries')
    .select('subscription_id')
    .eq('charge_date', chargeDate)
    .in('subscription_id', dueSubscriptions.map((item) => item.id));

  if (error) throw error;

  const deliveredIds = new Set(((data ?? []) as DeliveryRow[]).map((item) => item.subscription_id));
  return dueSubscriptions.filter((item) => !deliveredIds.has(item.id));
}

async function loadUserDevices(supabase: ReturnType<typeof createClient>, userIds: string[]) {
  if (userIds.length === 0) return [];

  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth')
    .eq('is_active', true)
    .in('user_id', userIds);

  if (error) throw error;
  return (data ?? []) as PushSubscriptionRow[];
}

async function sendNotifications(
  supabase: ReturnType<typeof createClient>,
  subscriptions: SubscriptionRow[],
  devices: PushSubscriptionRow[],
) {
  let sent = 0;

  for (const subscription of subscriptions) {
    const userDevices = devices.filter((device) => device.user_id === subscription.user_id);

    for (const device of userDevices) {
      sent += await sendToDevice(supabase, subscription, device);
    }

    if (userDevices.length > 0) await markDelivered(supabase, subscription);
  }

  return sent;
}

async function sendToDevice(
  supabase: ReturnType<typeof createClient>,
  subscription: SubscriptionRow,
  device: PushSubscriptionRow,
) {
  try {
    await webpush.sendNotification(
      { endpoint: device.endpoint, keys: { auth: device.auth, p256dh: device.p256dh } },
      createPushPayload(subscription),
    );
    return 1;
  } catch (err) {
    const statusCode = getWebPushStatusCode(err);
    if (statusCode === 404 || statusCode === 410) {
      await supabase.from('push_subscriptions').update({ is_active: false }).eq('id', device.id);
    }
    return 0;
  }
}

async function markDelivered(supabase: ReturnType<typeof createClient>, subscription: SubscriptionRow) {
  await supabase.from('push_notification_deliveries').insert({
    charge_date: subscription.charge_date,
    subscription_id: subscription.id,
    user_id: subscription.user_id,
  });
}
