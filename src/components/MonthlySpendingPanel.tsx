import { useI18n } from '../lib/i18n';
import { formatMoney, type CurrencyCode } from '../lib/currency';
import { convertMoney, type ExchangeRates, type RateStatus } from '../lib/exchangeRates';
import type { Subscription } from '../lib/subscriptions';
import { CurrencyViewSelector } from './CurrencyViewSelector';

type Props = {
  displayCurrency: CurrencyCode;
  rateStatus: RateStatus;
  rateUpdatedAt: string;
  rates: ExchangeRates;
  subscriptions: Subscription[];
  onCurrencyChange: (currency: CurrencyCode) => void;
};

export function MonthlySpendingPanel({
  displayCurrency,
  onCurrencyChange,
  rateStatus,
  rateUpdatedAt,
  rates,
  subscriptions,
}: Props) {
  const { locale, t } = useI18n();
  const convertedItems = subscriptions.map((item) => ({
    ...item,
    displayCost: convertMoney(item.cost, item.currency, displayCurrency, rates),
  }));
  const total = convertedItems.reduce((sum, item) => sum + item.displayCost, 0);
  const topSubscriptions = [...convertedItems].sort((a, b) => b.displayCost - a.displayCost).slice(0, 4);
  const maxCost = topSubscriptions[0]?.displayCost ?? 0;
  const subscriptionGoal = 10;
  const monthlyBudget = convertMoney(50000, 'KZT', displayCurrency, rates);
  const subscriptionProgress = Math.min(100, (subscriptions.length / subscriptionGoal) * 100);
  const budgetProgress = Math.min(100, (total / monthlyBudget) * 100);
  const formattedTotal = formatMoney(total, displayCurrency, locale);

  return (
    <section className="monthly-spending-panel">
      <div className="monthly-spending-header">
        <div>
          <p>{t('monthlySpendingLabel')}</p>
          <strong>{formattedTotal}</strong>
          <span>{t('monthlySpendingCount', { count: subscriptions.length })}</span>
        </div>
        <CurrencyViewSelector
          currency={displayCurrency}
          status={rateStatus}
          updatedAt={rateUpdatedAt}
          onChange={onCurrencyChange}
        />
      </div>
      <div className="spending-progress-grid">
        <article>
          <div>
            <span>{t('subscriptionsProgress')}</span>
            <strong>{subscriptions.length}/{subscriptionGoal}</strong>
          </div>
          <div className="spending-progress-track">
            <span style={{ width: `${subscriptionProgress}%` }} />
          </div>
        </article>
        <article>
          <div>
            <span>{t('monthlyBudgetProgress')}</span>
            <strong>{formattedTotal}</strong>
          </div>
          <div className="spending-progress-track">
            <span style={{ width: `${budgetProgress}%` }} />
          </div>
        </article>
      </div>
      <div className="spending-bars">
        {topSubscriptions.length ? (
          topSubscriptions.map((item) => (
            <article key={item.id}>
              <div>
                <strong>{item.name}</strong>
                <span>{formatMoney(item.displayCost, displayCurrency, locale)}</span>
              </div>
              <div className="spending-track">
                <span style={{ width: `${Math.max(12, (item.displayCost / maxCost) * 100)}%` }} />
              </div>
            </article>
          ))
        ) : (
          <p className="spending-empty">{t('monthlySpendingEmpty')}</p>
        )}
      </div>
    </section>
  );
}
