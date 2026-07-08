import { supabase } from './supabase';

export type ReminderDay = 0 | 1 | 2;

export const reminderDayOptions: ReminderDay[] = [2, 1, 0];
export const defaultReminderDays: ReminderDay[] = [1, 0];

type PreferenceRow = {
  reminder_days: number[] | null;
};

export async function loadNotificationPreferences() {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('reminder_days')
    .maybeSingle();

  if (error) throw error;
  if (!data) return defaultReminderDays;

  return normalizeReminderDays((data as PreferenceRow).reminder_days);
}

export async function saveNotificationPreferences(reminderDays: ReminderDay[]) {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) throw new Error('Войдите в аккаунт, чтобы сохранить настройки.');

  const { error } = await supabase.from('notification_preferences').upsert({
    reminder_days: normalizeReminderDays(reminderDays),
    updated_at: new Date().toISOString(),
    user_id: userId,
  });

  if (error) throw error;
}

function normalizeReminderDays(value: unknown): ReminderDay[] {
  if (!Array.isArray(value)) return defaultReminderDays;

  const days = value
    .filter((item): item is ReminderDay => item === 0 || item === 1 || item === 2)
    .sort((left, right) => right - left);

  return days.length > 0 ? [...new Set(days)] : defaultReminderDays;
}
