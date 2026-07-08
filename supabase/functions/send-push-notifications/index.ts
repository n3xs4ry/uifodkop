import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import webpush from 'npm:web-push@3.6.7';
import {
  configureWebPush,
  cors,
  createPushPayload,
  dateInDays,
  getSupabaseConfig,
  getWebPushStatusCode,
  type DeliveryRow,
  type NotificationPreferenceRow,
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
    const preferences = await loadPreferences(supabase);
    const dueSubscriptions = await loadDueSubscriptions(supabase, preferences);
    const pendingSubscriptions = await filterPendingSubscriptions(supabase, dueSubscriptions);
    const devices = await loadUserDevices(
      supabase,
      [...new Set(pendingSubscriptions.map((item) => item.user_id))],
    );
    const sent = await sendNotifications(supabase, pendingSubscriptions, devices);

    return json({ checkedDays: [2, 1, 0], sent });
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

async function loadPreferences(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('user_id, reminder_days');

  if (error) throw error;
  return new Map(
    ((data ?? []) as NotificationPreferenceRow[]).map((item) => [
      item.user_id,
      normalizeReminderDays(item.reminder_days),
    ]),
  );
}

async function loadDueSubscriptions(
  supabase: ReturnType<typeof createClient>,
  preferences: Map<string, number[]>,
) {
  const rows = await Promise.all([2, 1, 0].map((day) => loadDueSubscriptionsForDay(supabase, day)));

  return rows.flat().filter((item) => {
    const userDays = preferences.get(item.user_id) ?? [1, 0];
    return userDays.includes(item.days_before);
  });
}

async function loadDueSubscriptionsForDay(supabase: ReturnType<typeof createClient>, daysBefore: number) {
  const chargeDate = dateInDays(daysBefore);
  const { data, error } = await supabase
    .from('subscriptions')
    .select('id, user_id, name, cost, charge_date')
    .eq('charge_date', chargeDate);

  if (error) throw error;
  return ((data ?? []) as Omit<SubscriptionRow, 'days_before'>[]).map((item) => ({
    ...item,
    days_before: daysBefore,
  }));
}

async function filterPendingSubscriptions(
  supabase: ReturnType<typeof createClient>,
  dueSubscriptions: SubscriptionRow[],
) {
  if (dueSubscriptions.length === 0) return [];

  const { data, error } = await supabase
    .from('push_notification_deliveries')
    .select('subscription_id, charge_date, days_before')
    .in('subscription_id', dueSubscriptions.map((item) => item.id));

  if (error) throw error;

  const deliveredIds = new Set(
    ((data ?? []) as DeliveryRow[]).map((item) => (
      `${item.subscription_id}:${item.charge_date}:${item.days_before}`
    )),
  );
  return dueSubscriptions.filter((item) => (
    !deliveredIds.has(`${item.id}:${item.charge_date}:${item.days_before}`)
  ));
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
    days_before: subscription.days_before,
    subscription_id: subscription.id,
    user_id: subscription.user_id,
  });
}

function normalizeReminderDays(value: number[] | null) {
  if (!Array.isArray(value)) return [1, 0];
  const days = value.filter((item) => item === 0 || item === 1 || item === 2);
  return days.length > 0 ? days : [1, 0];
}
