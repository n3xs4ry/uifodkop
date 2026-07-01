import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import webpush from 'npm:web-push@3.6.7';

type Channel = 'push' | 'telegram';

type RequestBody = {
  channel?: Channel;
};

type PushSubscriptionRow = {
  auth: string;
  endpoint: string;
  p256dh: string;
};

type TelegramConnectionRow = {
  chat_id: string;
};

const cors = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Origin': '*',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const userId = await getUserId(req);
    const body = (await req.json()) as RequestBody;

    if (body.channel === 'telegram') {
      await sendTelegramTest(userId);
      return json({ ok: true, message: 'Тест отправлен в Telegram.' });
    }

    if (body.channel === 'push') {
      const sent = await sendPushTest(userId);
      return json({ ok: true, message: `Push отправлен на устройств: ${sent}.` });
    }

    return json({ error: 'Неизвестный канал уведомления.' }, 400);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

function getEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Нет ${name}.`);
  return value;
}

function createAnonClient() {
  return createClient(getEnv('SUPABASE_URL'), getEnv('SUPABASE_ANON_KEY'));
}

function createServiceClient() {
  return createClient(getEnv('SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));
}

async function getUserId(req: Request) {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) throw new Error('Нужно войти в аккаунт.');

  const { data, error } = await createAnonClient().auth.getUser(token);
  if (error || !data.user) throw new Error('Не получилось проверить пользователя.');

  return data.user.id;
}

async function sendTelegramTest(userId: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('telegram_connections')
    .select('chat_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .not('chat_id', 'is', null)
    .maybeSingle();

  if (error) throw error;
  const connection = data as TelegramConnectionRow | null;
  if (!connection) throw new Error('Telegram еще не подключен.');

  await sendTelegramMessage(connection.chat_id, 'Тестовое уведомление от Sub Tracker. Telegram работает.');
}

async function sendPushTest(userId: string) {
  configureWebPush();

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) throw error;
  const devices = (data ?? []) as PushSubscriptionRow[];
  if (devices.length === 0) throw new Error('Push еще не включен на этом устройстве.');

  let sent = 0;

  for (const device of devices) {
    await webpush.sendNotification(
      { endpoint: device.endpoint, keys: { auth: device.auth, p256dh: device.p256dh } },
      JSON.stringify({
        body: 'Push-уведомления работают.',
        tag: `test-${userId}-${Date.now()}`,
        title: 'Тест Sub Tracker',
        url: '/',
      }),
    );
    sent += 1;
  }

  return sent;
}

function configureWebPush() {
  webpush.setVapidDetails(
    Deno.env.get('VAPID_SUBJECT') ?? 'mailto:hello@example.com',
    getEnv('VAPID_PUBLIC_KEY'),
    getEnv('VAPID_PRIVATE_KEY'),
  );
}

async function sendTelegramMessage(chatId: string, text: string) {
  const url = `https://api.telegram.org/bot${getEnv('TELEGRAM_BOT_TOKEN')}/sendMessage`;
  await fetch(url, {
    body: JSON.stringify({ chat_id: chatId, text }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...cors, 'Content-Type': 'application/json' },
    status,
  });
}
