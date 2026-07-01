import { useI18n } from '../lib/i18n';
import { summarizeCategories, type CategoryKey } from '../lib/subscriptionCategories';
import type { Subscription } from '../lib/subscriptions';

type Props = {
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

function formatMoney(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    currency: 'KZT',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value);
}

export function CategoryBreakdownPanel({ subscriptions }: Props) {
  const { locale, t } = useI18n();
  const categories = summarizeCategories(subscriptions);
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
              <strong>{formatMoney(category.total, locale)}</strong>
            </article>
          ))}
        </div>
      ) : (
        <p className="category-empty">{t('categoryEmpty')}</p>
      )}
    </section>
  );
}
