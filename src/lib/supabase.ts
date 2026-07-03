import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseUrl = cleanEnvValue(rawUrl);
export const supabaseAnonKey = cleanEnvValue(rawAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Нет ключей Supabase. Добавьте VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в .env.local и Vercel Environment Variables.',
  );
}

if (!isSupabaseUrl(supabaseUrl) || !isAscii(supabaseAnonKey)) {
  throw new Error(
    'Неверные ключи Supabase. VITE_SUPABASE_URL должен выглядеть как https://project.supabase.co, а VITE_SUPABASE_ANON_KEY должен быть anon public key из Supabase API Settings.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

function cleanEnvValue(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, '') ?? '';
}

function isSupabaseUrl(value: string) {
  return /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(value);
}

function isAscii(value: string) {
  return /^[\x00-\x7F]+$/.test(value);
}
