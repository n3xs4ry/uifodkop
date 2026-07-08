import { CurrencyViewSelector } from './CurrencyViewSelector';
import { type CurrencyCode } from '../lib/currency';
import type { RateStatus } from '../lib/exchangeRates';

type Props = {
  displayCurrency: CurrencyCode;
  monthlyLabel: string;
  monthlyTotal: string;
  nextChargeText: string;
  rateStatus: RateStatus;
  rateUpdatedAt: string;
  title: string;
  copy: string;
  onCurrencyChange: (currency: CurrencyCode) => void;
};

export function DashboardHero({
  copy,
  displayCurrency,
  monthlyLabel,
  monthlyTotal,
  nextChargeText,
  onCurrencyChange,
  rateStatus,
  rateUpdatedAt,
  title,
}: Props) {
  return (
    <section className="hero">
      <div>
        <p className="eyebrow">Sub Tracker</p>
        <h1>{title}</h1>
        <p className="hero-copy">{copy}</p>
      </div>
      <div className="hero-stat">
        <span>{monthlyLabel}</span>
        <strong>{monthlyTotal}</strong>
        <CurrencyViewSelector
          currency={displayCurrency}
          status={rateStatus}
          updatedAt={rateUpdatedAt}
          onChange={onCurrencyChange}
        />
        <p>{nextChargeText}</p>
      </div>
    </section>
  );
}
