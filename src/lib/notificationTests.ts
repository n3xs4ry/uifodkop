import { supabase } from './supabase';

type NotificationChannel = 'push' | 'telegram';

type TestResponse = {
  message?: string;
};

export async function sendTestNotification(channel: NotificationChannel) {
  const { data, error } = await supabase.functions.invoke<TestResponse>('test-notifications', {
    body: { channel },
  });

  if (error) throw error;
  return data?.message ?? 'Тест отправлен.';
}
