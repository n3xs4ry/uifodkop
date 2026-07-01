import { useI18n } from '../lib/i18n';
import { formatLongDate, formatMonthName } from '../lib/dateFormat';
import type { Subscription } from '../lib/subscriptions';
import { daysUntil } from '../lib/subscriptions';

type Props = {
  subscriptions: Subscription[];
};

function createMonthDays() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const days = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: days }, (_, index) => {
    const day = index + 1;
    const value = new Date(year, month, day).toISOString().slice(0, 10);
    return { day, value };
  });
}

export function BillingCalendar({ subscriptions }: Props) {
  const monthDays = createMonthDays();
  const { language, locale, t } = useI18n();
  const currentMonth = formatMonthName(new Date(), language, locale);

  return (
    <section className="panel calendar-panel">
      <div className="section-heading">
        <p>{t('calendar')}</p>
        <h2>{currentMonth}</h2>
      </div>
      <div className="calendar-grid">
        {monthDays.map((item) => {
          const items = subscriptions.filter((sub) => sub.chargeDate === item.value);
          const isSoon = items.some((sub) => daysUntil(sub.chargeDate) <= 3);

          return (
            <div className={`calendar-day ${items.length ? 'has-bill' : ''} ${isSoon ? 'is-soon' : ''}`} key={item.value}>
              <span>{item.day}</span>
              {items.slice(0, 2).map((sub) => (
                <strong key={sub.id} title={`${sub.name}, ${formatLongDate(sub.chargeDate, language, locale)}`}>
                  {sub.name}
                </strong>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}
