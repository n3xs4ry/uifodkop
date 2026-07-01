import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

type TelegramMessage = {
  chat?: { id: number; title?: string; first_name?: string; username?: string };
  text?: string;
};

type TelegramUpdate = {
  message?: TelegramMessage;
};

const cors = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Origin': '*',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const update = (await req.json()) as TelegramUpdate;
    const message = update.message;
    const text = message?.text?.trim() ?? '';
    const token = text.match(/^\/start\s+(.+)$/)?.[1]?.trim();
    const chatId = message?.chat?.id ? String(message.chat.id) : '';

    if (!chatId) return json({ ok: true });

    if (text === '/start') {
      await sendTelegramMessage(chatId, 'Открой приложение, нажми "Подключить Telegram", скопируй команду /start с кодом и отправь ее сюда.');
      return json({ ok: true });
    }

    if (!token) {
      await sendTelegramMessage(chatId, 'Не вижу код подключения. Нужна команда вида: /start длинный-код');
      return json({ ok: true });
    }

    const supabase = createClient(getEnv('SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));
    const chatTitle = getChatTitle(message);
    const connection = await loadConnectionByToken(supabase, token);

    if (!connection) {
      await sendTelegramMessage(chatId, 'Не нашел код подключения. Нажми кнопку в приложении еще раз.');
      return json({ ok: true });
    }

    await supabase
      .from('telegram_connections')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', connection.user_id)
      .neq('id', connection.id);

    const { error } = await supabase
      .from('telegram_connections')
      .update({
        chat_id: chatId,
        chat_title: chatTitle,
        connected_at: new Date().toISOString(),
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('connect_token', token);

    if (error) throw error;
    await sendTelegramMessage(chatId, 'Telegram подключен. Я предупрежу за день до списания.');

    return json({ ok: true });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});

async function loadConnectionByToken(supabase: ReturnType<typeof createClient>, token: string) {
  const { data, error } = await supabase
    .from('telegram_connections')
    .select('id, user_id')
    .eq('connect_token', token)
    .maybeSingle();

  if (error) throw error;
  return data as { id: string; user_id: string } | null;
}

function getEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Нет ${name}.`);
  return value;
}

function getChatTitle(message: TelegramMessage) {
  const chat = message.chat;
  return chat?.title ?? chat?.first_name ?? chat?.username ?? null;
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
