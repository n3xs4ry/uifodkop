import { useI18n } from '../lib/i18n';
import { formatCurrencyTotals, formatMoney } from '../lib/currency';
import type { Subscription } from '../lib/subscriptions';

type Props = {
  subscriptions: Subscription[];
};

export function MonthlySpendingPanel({ subscriptions }: Props) {
  const { locale, t } = useI18n();
  const total = subscriptions.reduce((sum, item) => sum + item.cost, 0);
  const topSubscriptions = [...subscriptions].sort((a, b) => b.cost - a.cost).slice(0, 4);
  const maxCost = topSubscriptions[0]?.cost ?? 0;
  const subscriptionGoal = 10;
  const monthlyBudget = 50000;
  const subscriptionProgress = Math.min(100, (subscriptions.length / subscriptionGoal) * 100);
  const budgetProgress = Math.min(100, (total / monthlyBudget) * 100);

  return (
    <section className="monthly-spending-panel">
      <div className="monthly-spending-header">
        <p>{t('monthlySpendingLabel')}</p>
        <strong>{formatCurrencyTotals(subscriptions, locale) || formatMoney(0, 'KZT', locale)}</strong>
        <span>{t('monthlySpendingCount', { count: subscriptions.length })}</span>
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
            <strong>{formatCurrencyTotals(subscriptions, locale) || formatMoney(0, 'KZT', locale)}</strong>
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
                <span>{formatMoney(item.cost, item.currency, locale)}</span>
              </div>
              <div className="spending-track">
                <span style={{ width: `${Math.max(12, (item.cost / maxCost) * 100)}%` }} />
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
