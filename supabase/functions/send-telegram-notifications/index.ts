import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import {
  loadDueSubscriptions,
  loadPreferences,
  type DeliveryRow,
  type SubscriptionRow,
} from './helpers.ts';

type TelegramConnectionRow = {
  user_id: string;
  chat_id: string;
};

const cronSecret = Deno.env.get('NOTIFICATIONS_CRON_SECRET');

Deno.serve(async (req) => {
  try {
    if (cronSecret && req.headers.get('x-cron-secret') !== cronSecret) {
      return json({ error: 'Forbidden' }, 403);
    }

    const supabase = createClient(getEnv('SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));
    const preferences = await loadPreferences(supabase);
    const dueSubscriptions = await loadDueSubscriptions(supabase, preferences);
    const pendingSubscriptions = await filterPendingSubscriptions(supabase, dueSubscriptions);
    const chats = await loadTelegramChats(supabase, pendingSubscriptions.map((item) => item.user_id));
    const sent = await sendAlerts(supabase, pendingSubscriptions, chats);

    return json({ checkedDays: [2, 1, 0], sent });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});

function getEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Нет ${name}.`);
  return value;
}

async function filterPendingSubscriptions(
  supabase: ReturnType<typeof createClient>,
  subscriptions: SubscriptionRow[],
) {
  if (subscriptions.length === 0) return [];

  const { data, error } = await supabase
    .from('telegram_notification_deliveries')
    .select('subscription_id, charge_date, days_before')
    .in('subscription_id', subscriptions.map((item) => item.id));

  if (error) throw error;
  const deliveredIds = new Set(
    ((data ?? []) as DeliveryRow[]).map((item) => (
      `${item.subscription_id}:${item.charge_date}:${item.days_before}`
    )),
  );
  return subscriptions.filter((item) => (
    !deliveredIds.has(`${item.id}:${item.charge_date}:${item.days_before}`)
  ));
}

async function loadTelegramChats(supabase: ReturnType<typeof createClient>, userIds: string[]) {
  if (userIds.length === 0) return [];

  const { data, error } = await supabase
    .from('telegram_connections')
    .select('user_id, chat_id')
    .eq('is_active', true)
    .in('user_id', [...new Set(userIds)])
    .not('chat_id', 'is', null);

  if (error) throw error;
  return (data ?? []) as TelegramConnectionRow[];
}

async function sendAlerts(
  supabase: ReturnType<typeof createClient>,
  subscriptions: SubscriptionRow[],
  chats: TelegramConnectionRow[],
) {
  let sent = 0;

  for (const subscription of subscriptions) {
    const chat = chats.find((item) => item.user_id === subscription.user_id);
    if (!chat) continue;

    await sendTelegramMessage(chat.chat_id, createAlertText(subscription));
    await markDelivered(supabase, subscription);
    sent += 1;
  }

  return sent;
}

function createAlertText(subscription: SubscriptionRow) {
  const cost = new Intl.NumberFormat('ru-RU', { currency: 'KZT', style: 'currency' }).format(
    Number(subscription.cost),
  );
  const lead = subscription.days_before === 0 ? 'Сегодня списание' : `Списание через ${subscription.days_before} дн.`;
  return `${lead}: ${subscription.name}\nСумма: ${cost}`;
}

async function sendTelegramMessage(chatId: string, text: string) {
  const url = `https://api.telegram.org/bot${getEnv('TELEGRAM_BOT_TOKEN')}/sendMessage`;
  await fetch(url, {
    body: JSON.stringify({ chat_id: chatId, text }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
}

async function markDelivered(supabase: ReturnType<typeof createClient>, subscription: SubscriptionRow) {
  await supabase.from('telegram_notification_deliveries').insert({
    charge_date: subscription.charge_date,
    days_before: subscription.days_before,
    subscription_id: subscription.id,
    user_id: subscription.user_id,
  });
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    status,
  });
}
