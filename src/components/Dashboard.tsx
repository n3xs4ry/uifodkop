import { useEffect, useMemo, useState } from 'react';
import { BillingCalendar } from './BillingCalendar';
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

export function Dashboard() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [error, setError] = useState('');
  const { t } = useI18n();

  async function refresh() {
    try {
      setSubscriptions(await loadSubscriptions());
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loadSubscriptionsError'));
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

  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">Sub Tracker</p>
          <h1>{t('heroTitle')}</h1>
          <p className="hero-copy">{t('heroCopy')}</p>
        </div>
        <div className="hero-stat">
          <span>{t('monthly')}</span>
          <strong>{monthlyTotal.toLocaleString('ru-RU')} ₸</strong>
          <p>{nextCharge ? t('nextCharge', { name: nextCharge.name }) : t('addFirst')}</p>
        </div>
      </section>
      {error && <p className="message">{error}</p>}
      <section className="layout">
        <div className="stack">
          <section className="panel">
            <div className="section-heading">
              <p>{t('newSubscription')}</p>
              <h2>{t('addCharge')}</h2>
            </div>
            <SubscriptionForm onAdd={handleAdd} />
          </section>
          <TelegramNotificationSettings />
          <PushNotificationSettings />
          <NotificationTestPanel />
          <BillingCalendar subscriptions={subscriptions} />
        </div>
        <SubscriptionList subscriptions={subscriptions} onDelete={handleDelete} onUpdate={handleUpdate} />
      </section>
    </>
  );
}
