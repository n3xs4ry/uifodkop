import { useEffect, useMemo, useState } from 'react';
import { type CurrencyCode, currencies } from './currency';

export type ExchangeRates = Record<CurrencyCode, number>;
export type RateStatus = 'fallback' | 'live' | 'loading';

const fallbackRates: ExchangeRates = {
  EUR: 0.0017,
  GBP: 0.0015,
  KZT: 1,
  RUB: 0.15,
  TRY: 0.0078,
  USD: 0.0019,
};

type ApiResponse = {
  rates?: Partial<Record<CurrencyCode, number>>;
  result?: string;
  time_last_update_utc?: string;
};

export function useExchangeRates() {
  const [rates, setRates] = useState<ExchangeRates>(fallbackRates);
  const [status, setStatus] = useState<RateStatus>('loading');
  const [updatedAt, setUpdatedAt] = useState('');

  useEffect(() => {
    let active = true;

    fetch('https://open.er-api.com/v6/latest/KZT')
      .then((response) => response.json() as Promise<ApiResponse>)
      .then((data) => {
        if (!active) return;
        if (data.result !== 'success' || !data.rates) {
          setStatus('fallback');
          return;
        }
        setRates(normalizeRates(data.rates));
        setUpdatedAt(data.time_last_update_utc ?? '');
        setStatus('live');
      })
      .catch(() => {
        if (active) setStatus('fallback');
      });

    return () => {
      active = false;
    };
  }, []);

  return useMemo(() => ({ rates, status, updatedAt }), [rates, status, updatedAt]);
}

export function convertMoney(value: number, from: CurrencyCode, to: CurrencyCode, rates: ExchangeRates) {
  if (from === to) return value;
  const fromRate = rates[from] || fallbackRates[from];
  const toRate = rates[to] || fallbackRates[to];
  return (value / fromRate) * toRate;
}

function normalizeRates(apiRates: Partial<Record<CurrencyCode, number>>): ExchangeRates {
  return currencies.reduce<ExchangeRates>((current, currency) => ({
    ...current,
    [currency]: Number(apiRates[currency] ?? fallbackRates[currency]),
  }), fallbackRates);
}
