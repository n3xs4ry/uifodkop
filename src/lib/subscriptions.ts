import { supabase } from './supabase';
import { normalizeCurrency, type CurrencyCode } from './currency';

export type Subscription = {
  id: string;
  name: string;
  cost: number;
  currency: CurrencyCode;
  chargeDate: string;
  createdAt: string;
};

type SubscriptionRow = {
  id: string;
  name: string;
  cost: number;
  currency: string | null;
  charge_date: string;
  created_at: string;
};

export type NewSubscription = {
  name: string;
  cost: number;
  currency: CurrencyCode;
  chargeDate: string;
};

export type SubscriptionUpdate = NewSubscription;

function mapSubscription(row: SubscriptionRow): Subscription {
  return {
    id: row.id,
    name: row.name,
    cost: Number(row.cost),
    currency: normalizeCurrency(row.currency),
    chargeDate: row.charge_date,
    createdAt: row.created_at,
  };
}

export async function loadSubscriptions() {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('id, name, cost, currency, charge_date, created_at')
    .order('charge_date', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapSubscription(row as SubscriptionRow));
}

export async function addSubscription(item: NewSubscription) {
  const { error } = await supabase.from('subscriptions').insert({
    name: item.name,
    cost: item.cost,
    currency: item.currency,
    charge_date: item.chargeDate,
  });

  if (error) throw error;
}

export async function deleteSubscription(id: string) {
  const { error } = await supabase.from('subscriptions').delete().eq('id', id);
  if (error) throw error;
}

export async function updateSubscription(id: string, item: SubscriptionUpdate) {
  const { error } = await supabase
    .from('subscriptions')
    .update({
      name: item.name,
      cost: item.cost,
      currency: item.currency,
      charge_date: item.chargeDate,
    })
    .eq('id', id);

  if (error) throw error;
}

export function daysUntil(date: string) {
  const today = new Date();
  const target = new Date(`${date}T00:00:00`);
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}
