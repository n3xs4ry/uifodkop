import { useState } from 'react';
import { useI18n } from '../lib/i18n';
import type { CurrencyCode } from '../lib/currency';
import type { NewSubscription } from '../lib/subscriptions';

type Props = {
  currency: CurrencyCode;
  onAdd: (subscription: NewSubscription) => Promise<void>;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function SubscriptionForm({ currency, onAdd }: Props) {
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [chargeDate, setChargeDate] = useState(today());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { t } = useI18n();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const amount = Number(cost);

    if (!name.trim() || Number.isNaN(amount) || amount < 0) {
      setError(t('invalidSubscription'));
      setSuccess('');
      return;
    }

    setBusy(true);
    setError('');
    setSuccess('');

    try {
      await onAdd({ name: name.trim(), cost: amount, currency, chargeDate });
      setName('');
      setCost('');
      setChargeDate(today());
      setSuccess(t('subscriptionAdded'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('addSubscriptionError'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="subscription-form" onSubmit={handleSubmit}>
      <label>
        {t('name')}
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Spotify" />
      </label>
      <label>
        {t('cost')}
        <input min="0" step="0.01" type="number" value={cost} onChange={(event) => setCost(event.target.value)} placeholder="2490" />
      </label>
      <label>
        {t('chargeDate')}
        <input type="date" value={chargeDate} onChange={(event) => setChargeDate(event.target.value)} />
      </label>
      <button type="submit" disabled={busy}>{busy ? t('adding') : t('add')}</button>
      {error && <p className="message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
    </form>
  );
}
