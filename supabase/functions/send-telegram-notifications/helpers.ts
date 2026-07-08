import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

export type SubscriptionRow = {
  id: string;
  user_id: string;
  name: string;
  cost: number;
  charge_date: string;
  days_before: number;
};

export type DeliveryRow = {
  charge_date: string;
  days_before: number;
  subscription_id: string;
};

type NotificationPreferenceRow = {
  user_id: string;
  reminder_days: number[] | null;
};

const timeZone = Deno.env.get('NOTIFICATIONS_TIME_ZONE') ?? 'Asia/Almaty';

export function dateInDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);

  return new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone,
    year: 'numeric',
  }).format(date);
}

export async function loadPreferences(supabase: ReturnType<typeof createClient>) {
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

export async function loadDueSubscriptions(
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
  const { data, error } = await supabase
    .from('subscriptions')
    .select('id, user_id, name, cost, charge_date')
    .eq('charge_date', dateInDays(daysBefore));

  if (error) throw error;
  return ((data ?? []) as Omit<SubscriptionRow, 'days_before'>[]).map((item) => ({
    ...item,
    days_before: daysBefore,
  }));
}

export function normalizeReminderDays(value: number[] | null) {
  if (!Array.isArray(value)) return [1, 0];
  const days = value.filter((item) => item === 0 || item === 1 || item === 2);
  return days.length > 0 ? days : [1, 0];
}
