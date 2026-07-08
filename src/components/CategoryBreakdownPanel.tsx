import { useI18n } from '../lib/i18n';
import { formatMoney, type CurrencyCode } from '../lib/currency';
import { convertMoney, type ExchangeRates } from '../lib/exchangeRates';
import { getSubscriptionCategory, type CategoryKey } from '../lib/subscriptionCategories';
import type { Subscription } from '../lib/subscriptions';

type Props = {
  displayCurrency: CurrencyCode;
  rates: ExchangeRates;
  subscriptions: Subscription[];
};

const categoryIcons: Record<CategoryKey, string> = {
  ai: 'AI',
  education: 'ED',
  games: 'GM',
  music: 'MU',
  other: 'OT',
  video: 'VI',
};

export function CategoryBreakdownPanel({ displayCurrency, rates, subscriptions }: Props) {
  const { locale, t } = useI18n();
  const categories = summarizeCategories(subscriptions, displayCurrency, rates);
  const maxTotal = categories[0]?.total ?? 0;

  return (
    <section className="category-panel">
      <div className="section-heading">
        <p>{t('categoryPanelLabel')}</p>
        <h2>{t('categoryPanelTitle')}</h2>
      </div>
      {categories.length ? (
        <div className="category-list">
          {categories.map((category) => (
            <article key={category.key}>
              <span className={`category-icon category-${category.key}`}>{categoryIcons[category.key]}</span>
              <div>
                <strong>{t(`category_${category.key}`)}</strong>
                <p>{t('categoryCount', { count: category.count })}</p>
                <div className="category-track">
                  <span style={{ width: `${Math.max(14, (category.total / maxTotal) * 100)}%` }} />
                </div>
              </div>
              <strong>{formatMoney(category.total, displayCurrency, locale)}</strong>
            </article>
          ))}
        </div>
      ) : (
        <p className="category-empty">{t('categoryEmpty')}</p>
      )}
    </section>
  );
}

function summarizeCategories(
  subscriptions: Subscription[],
  displayCurrency: CurrencyCode,
  rates: ExchangeRates,
) {
  const summary = new Map<CategoryKey, { key: CategoryKey; total: number; count: number }>();

  subscriptions.forEach((subscription) => {
    const key = getSubscriptionCategory(subscription);
    const current = summary.get(key) ?? { key, total: 0, count: 0 };
    summary.set(key, {
      ...current,
      count: current.count + 1,
      total: current.total + convertMoney(subscription.cost, subscription.currency, displayCurrency, rates),
    });
  });

  return [...summary.values()].sort((a, b) => b.total - a.total);
}
