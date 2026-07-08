import { useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { AiAssistantChat } from './AiAssistantChat';
import { CategoryBreakdownPanel } from './CategoryBreakdownPanel';
import { DashboardHero } from './DashboardHero';
import { DashboardTools, type ToolTab } from './DashboardTools';
import { MonthlySpendingPanel } from './MonthlySpendingPanel';
import { SubscriptionForm } from './SubscriptionForm';
import { SubscriptionList } from './SubscriptionList';
import { useI18n } from '../lib/i18n';
import { formatMoney, type CurrencyCode } from '../lib/currency';
import { convertMoney, useExchangeRates } from '../lib/exchangeRates';
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

type Props = {
  session: Session | null;
};

export function Dashboard({ session }: Props) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [error, setError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [activeTool, setActiveTool] = useState<ToolTab>('calendar');
  const [displayCurrency, setDisplayCurrency] = useState<CurrencyCode>('KZT');
  const exchange = useExchangeRates();
  const { locale, t } = useI18n();

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
    () => formatMoney(
      subscriptions.reduce((sum, item) => (
        sum + convertMoney(item.cost, item.currency, displayCurrency, exchange.rates)
      ), 0),
      displayCurrency,
      locale,
    ),
    [displayCurrency, exchange.rates, locale, subscriptions],
  );

  const nextCharge = subscriptions
    .filter((item) => daysUntil(item.chargeDate) >= 0)
    .sort((a, b) => daysUntil(a.chargeDate) - daysUntil(b.chargeDate))[0];

  async function handleAdd(item: NewSubscription) {
    await addSubscription(item);
    await refresh();
    setAddSuccess(t('subscriptionAdded'));
    window.setTimeout(() => setAddSuccess(''), 4200);
  }

  async function handleDelete(id: string) {
    setAddSuccess('');
    await deleteSubscription(id);
    await refresh();
  }

  async function handleUpdate(id: string, item: SubscriptionUpdate) {
    setAddSuccess('');
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
      <DashboardHero
        copy={t('heroCopy')}
        monthlyLabel={t('monthly')}
        monthlyTotal={monthlyTotal}
        nextChargeText={nextCharge ? t('nextCharge', { name: nextCharge.name }) : t('addFirst')}
        title={t('heroTitle')}
      />
      {error && <p className="message">{error}</p>}
      {addSuccess && (
        <p className="success-message dashboard-success" role="status">
          {addSuccess}
        </p>
      )}
      <section className="layout">
        <div className="stack">
          <section className="panel">
            <div className="section-heading">
              <p>{t('newSubscription')}</p>
              <h2>{t('addCharge')}</h2>
            </div>
            <SubscriptionForm currency={displayCurrency} onAdd={handleAdd} />
          </section>
          <DashboardTools
            activeTool={activeTool}
            subscriptions={subscriptions}
            toolTabs={toolTabs}
            onToolChange={setActiveTool}
          />
        </div>
        <div className="dashboard-main">
          <MonthlySpendingPanel
            displayCurrency={displayCurrency}
            rateStatus={exchange.status}
            rateUpdatedAt={exchange.updatedAt}
            rates={exchange.rates}
            subscriptions={subscriptions}
            onCurrencyChange={setDisplayCurrency}
          />
          <CategoryBreakdownPanel displayCurrency={displayCurrency} rates={exchange.rates} subscriptions={subscriptions} />
          <SubscriptionList subscriptions={subscriptions} onDelete={handleDelete} onUpdate={handleUpdate} />
        </div>
      </section>
      <AiAssistantChat session={session} subscriptions={subscriptions} onAddSubscription={handleAdd} />
    </>
  );
}
