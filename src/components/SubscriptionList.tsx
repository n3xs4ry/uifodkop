import { useState } from 'react';
import warningImage from '../assets/payment-warning.png';
import { formatLongDate } from '../lib/dateFormat';
import { useI18n } from '../lib/i18n';
import type { Subscription, SubscriptionUpdate } from '../lib/subscriptions';
import { daysUntil } from '../lib/subscriptions';
import { SubscriptionEditForm } from './SubscriptionEditForm';

type Props = {
  subscriptions: Subscription[];
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, subscription: SubscriptionUpdate) => Promise<void>;
};

function formatMoney(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    currency: 'KZT',
    style: 'currency',
  }).format(value);
}

export function SubscriptionList({ subscriptions, onDelete, onUpdate }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const { language, locale, t } = useI18n();

  function statusText(days: number) {
    if (days < 0) return t('datePassed');
    if (days === 0) return t('chargeToday');
    if (days === 1) return t('chargeTomorrow');
    if (days <= 3) return t('daysLeft', { days });
    return t('daysAfter', { days });
  }

  if (subscriptions.length === 0) {
    return (
      <section className="panel empty-state">
        <h2>{t('noSubscriptions')}</h2>
        <p>{t('emptyHint')}</p>
      </section>
    );
  }

  return (
    <section className="subscriptions-list">
      {subscriptions.map((sub) => {
        const days = daysUntil(sub.chargeDate);
        const urgent = days <= 3;
        const editing = editingId === sub.id;

        return (
          <article className={`subscription-card ${urgent ? 'urgent' : ''}`} key={sub.id}>
            <div className="warning-art">
              <img src={warningImage} alt={t('attention')} />
              <span>{urgent ? t('attention') : t('planned')}</span>
            </div>
            <div className="subscription-info">
              {editing ? (
                <SubscriptionEditForm
                  subscription={sub}
                  onCancel={() => setEditingId(null)}
                  onSave={async (item) => {
                    await onUpdate(sub.id, item);
                    setEditingId(null);
                  }}
                />
              ) : (
                <>
                  <p className="status-pill">{statusText(days)}</p>
                  <h3>{sub.name}</h3>
                  <div className="subscription-meta">
                    <strong>{formatMoney(sub.cost, locale)}</strong>
                    <span>{formatLongDate(sub.chargeDate, language, locale)}</span>
                  </div>
                </>
              )}
            </div>
            <div className="card-actions">
              <button
                className="icon-button"
                type="button"
                onClick={() => setEditingId(editing ? null : sub.id)}
                aria-label={t('edit', { name: sub.name })}
              >
                ✎
              </button>
              <button
                className="icon-button"
                type="button"
                onClick={() => onDelete(sub.id)}
                aria-label={t('delete', { name: sub.name })}
              >
                ×
              </button>
            </div>
          </article>
        );
      })}
    </section>
  );
}
