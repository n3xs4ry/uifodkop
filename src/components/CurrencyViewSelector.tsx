import { currencies, type CurrencyCode } from '../lib/currency';
import type { RateStatus } from '../lib/exchangeRates';

type Props = {
  currency: CurrencyCode;
  status: RateStatus;
  updatedAt: string;
  onChange: (currency: CurrencyCode) => void;
};

export function CurrencyViewSelector({ currency, status, updatedAt, onChange }: Props) {
  const source = status === 'live' ? 'курс ExchangeRate-API' : 'примерный курс';

  return (
    <label className="currency-view-selector">
      <span>Валюта графиков</span>
      <select value={currency} onChange={(event) => onChange(event.target.value as CurrencyCode)}>
        {currencies.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <small>
        {source}
        {updatedAt ? ` · ${updatedAt.slice(5, 16)}` : ''}
      </small>
    </label>
  );
}
