import { useState } from 'react';
import { useI18n } from '../lib/i18n';
import type { Subscription, SubscriptionUpdate } from '../lib/subscriptions';

type Props = {
  subscription: Subscription;
  onCancel: () => void;
  onSave: (subscription: SubscriptionUpdate) => Promise<void>;
};

export function SubscriptionEditForm({ subscription, onCancel, onSave }: Props) {
  const [name, setName] = useState(subscription.name);
  const [cost, setCost] = useState(String(subscription.cost));
  const [chargeDate, setChargeDate] = useState(subscription.chargeDate);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { t } = useI18n();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const amount = Number(cost);

    if (!name.trim() || Number.isNaN(amount) || amount < 0) {
      setError(t('invalidSubscription'));
      return;
    }

    setBusy(true);
    setError('');

    try {
      await onSave({ name: name.trim(), cost: amount, chargeDate });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('saveSubscriptionError'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="edit-form" onSubmit={handleSubmit}>
      <label>
        {t('name')}
        <input value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <label>
        {t('cost')}
        <input min="0" step="0.01" type="number" value={cost} onChange={(event) => setCost(event.target.value)} />
      </label>
      <label>
        {t('chargeDate')}
        <input type="date" value={chargeDate} onChange={(event) => setChargeDate(event.target.value)} />
      </label>
      <div className="edit-actions">
        <button type="submit" disabled={busy}>{busy ? t('saving') : t('save')}</button>
        <button type="button" className="secondary-button" disabled={busy} onClick={onCancel}>{t('cancel')}</button>
      </div>
      {error && <p className="message">{error}</p>}
    </form>
  );
}
