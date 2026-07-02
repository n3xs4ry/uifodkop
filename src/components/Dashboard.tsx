import { useEffect, useMemo, useState } from 'react';
import { BillingCalendar } from './BillingCalendar';
import { CategoryBreakdownPanel } from './CategoryBreakdownPanel';
import { MonthlySpendingPanel } from './MonthlySpendingPanel';
import { NotificationTestPanel } from './NotificationTestPanel';
import { PushNotificationSettings } from './PushNotificationSettings';
import { SubscriptionForm } from './SubscriptionForm';
import { SubscriptionList } from './SubscriptionList';
import { TelegramNotificationSettings } from './TelegramNotificationSettings';
import { useI18n } from '../lib/i18n';
import {
  addSubscription,
  deleteSubscription,
  daysUntil,
  loadSubscriptions,
  updateSubscription,
  type NewSubscription,
  type Subscription,
  type SubscriptionUpdate,
} from '../lib/subscriptions';

type ToolTab = 'calendar' | 'telegram' | 'push';

export function Dashboard() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTool, setActiveTool] = useState<ToolTab>('calendar');
  const { t } = useI18n();

  async function refresh() {
    try {
      setSubscriptions(await loadSubscriptions());
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loadSubscriptionsError'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const monthlyTotal = useMemo(
    () => subscriptions.reduce((sum, item) => sum + item.cost, 0),
    [subscriptions],
  );

  const nextCharge = subscriptions
    .filter((item) => daysUntil(item.chargeDate) >= 0)
    .sort((a, b) => daysUntil(a.chargeDate) - daysUntil(b.chargeDate))[0];

  async function handleAdd(item: NewSubscription) {
    await addSubscription(item);
    await refresh();
  }

  async function handleDelete(id: string) {
    await deleteSubscription(id);
    await refresh();
  }

  async function handleUpdate(id: string, item: SubscriptionUpdate) {
    await updateSubscription(id, item);
    await refresh();
  }

  const toolTabs: Array<{ id: ToolTab; label: string }> = [
    { id: 'calendar', label: t('calendar') },
    { id: 'telegram', label: 'Telegram' },
    { id: 'push', label: 'Push' },
  ];

  return (
    <>
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Sub Tracker</p>
          <h1>{t('heroTitle')}</h1>
          <p className="hero-copy">{t('heroCopy')}</p>
        </div>
        <div className="summary-strip" aria-label={t('dashboardSummary')}>
          <article>
            <span>{t('monthly')}</span>
            <strong>{monthlyTotal.toLocaleString('ru-RU')} ₸</strong>
          </article>
          <article>
            <span>{t('nextPayment')}</span>
            <strong>{nextCharge ? nextCharge.name : t('noneYet')}</strong>
          </article>
        </div>
      </section>
      {error && <p className="message alert-message">{error}</p>}
      <section className="layout">
        <div className="stack">
          <section className="panel">
            <div className="section-heading">
              <p>{t('newSubscription')}</p>
              <h2>{t('addCharge')}</h2>
            </div>
            <SubscriptionForm onAdd={handleAdd} />
          </section>
          <div className="tool-tabs" aria-label={t('dashboardTools')}>
            {toolTabs.map((tab) => (
              <button
                className={activeTool === tab.id ? 'active' : ''}
                key={tab.id}
                type="button"
                onClick={() => setActiveTool(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {activeTool === 'calendar' && <BillingCalendar subscriptions={subscriptions} />}
          {activeTool === 'telegram' && (
            <>
              <TelegramNotificationSettings />
              <NotificationTestPanel />
            </>
          )}
          {activeTool === 'push' && (
            <>
              <PushNotificationSettings />
              <NotificationTestPanel />
            </>
          )}
        </div>
        <div className="dashboard-main">
          {loading ? (
            <section className="panel loading-panel">{t('loading')}</section>
          ) : (
            <>
              <MonthlySpendingPanel subscriptions={subscriptions} />
              <CategoryBreakdownPanel subscriptions={subscriptions} />
              <SubscriptionList subscriptions={subscriptions} onDelete={handleDelete} onUpdate={handleUpdate} />
            </>
          )}
        </div>
      </section>
    </>
  );
}
