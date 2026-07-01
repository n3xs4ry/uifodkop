import webpush from 'npm:web-push@3.6.7';

export type SubscriptionRow = {
  id: string;
  user_id: string;
  name: string;
  cost: number;
  charge_date: string;
};

export type PushSubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type DeliveryRow = {
  subscription_id: string;
};

export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

const timeZone = Deno.env.get('NOTIFICATIONS_TIME_ZONE') ?? 'Asia/Almaty';

export function todayInTimeZone() {
  return new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone,
    year: 'numeric',
  }).format(new Date());
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('ru-RU', {
    currency: 'KZT',
    style: 'currency',
  }).format(value);
}

export function createPushPayload(subscription: SubscriptionRow) {
  return JSON.stringify({
    body: `${subscription.name}: ${formatMoney(Number(subscription.cost))}`,
    tag: `subscription-${subscription.id}-${subscription.charge_date}`,
    title: 'Сегодня списание подписки',
    url: '/',
  });
}

export function configureWebPush() {
  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
  const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:hello@example.com';

  if (!vapidPublicKey || !vapidPrivateKey) {
    throw new Error('Нет VAPID_PUBLIC_KEY или VAPID_PRIVATE_KEY.');
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export function getSupabaseConfig() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Нет SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY.');
  }

  return { serviceRoleKey, supabaseUrl };
}

export function getWebPushStatusCode(err: unknown) {
  if (err instanceof Error && 'statusCode' in err) return Number(err.statusCode);
  return 0;
}
