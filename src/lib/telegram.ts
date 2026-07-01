import { supabase } from './supabase';

export type TelegramConnection = {
  chatTitle: string | null;
  isActive: boolean;
};

export type TelegramConnectData = {
  appLink: string;
  startCommand: string;
  webLink: string;
};

type TelegramConnectionRow = {
  chat_title: string | null;
  is_active: boolean;
};

const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string | undefined;

function createConnectToken() {
  if ('randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function loadTelegramConnection(): Promise<TelegramConnection | null> {
  const { data, error } = await supabase
    .from('telegram_connections')
    .select('chat_title, is_active')
    .eq('is_active', true)
    .order('connected_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as TelegramConnectionRow;
  return { chatTitle: row.chat_title, isActive: row.is_active };
}

export async function createTelegramConnectLink(): Promise<TelegramConnectData> {
  if (!botUsername) {
    throw new Error('Нет VITE_TELEGRAM_BOT_USERNAME в .env.local.');
  }

  const connectToken = createConnectToken();
  const { error } = await supabase.from('telegram_connections').insert({
    connect_token: connectToken,
  });

  if (error) throw error;

  const username = botUsername.replace('@', '');
  return {
    appLink: `tg://resolve?domain=${username}&start=${connectToken}`,
    startCommand: `/start ${connectToken}`,
    webLink: `https://t.me/${username}?start=${connectToken}`,
  };
}
