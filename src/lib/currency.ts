export type CurrencyCode = 'EUR' | 'GBP' | 'KZT' | 'RUB' | 'TRY' | 'USD';

export const currencies: CurrencyCode[] = ['KZT', 'USD', 'EUR', 'GBP', 'TRY', 'RUB'];

export function normalizeCurrency(value: string | null | undefined): CurrencyCode {
  return currencies.includes(value as CurrencyCode) ? (value as CurrencyCode) : 'KZT';
}

export function formatMoney(value: number, currency: CurrencyCode, locale: string) {
  return new Intl.NumberFormat(locale, {
    currency,
    maximumFractionDigits: currency === 'KZT' ? 0 : 2,
    style: 'currency',
  }).format(value);
}

export function formatCurrencyTotals(
  items: Array<{ cost: number; currency: CurrencyCode }>,
  locale: string,
) {
  const totals = new Map<CurrencyCode, number>();

  items.forEach((item) => {
    totals.set(item.currency, (totals.get(item.currency) ?? 0) + item.cost);
  });

  return [...totals.entries()]
    .sort(([left], [right]) => currencies.indexOf(left) - currencies.indexOf(right))
    .map(([currency, value]) => formatMoney(value, currency, locale))
    .join(' + ');
}
