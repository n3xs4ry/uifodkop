import { useState } from 'react';
import { useI18n } from '../lib/i18n';
import { sendTestNotification } from '../lib/notificationTests';

type Channel = 'push' | 'telegram';

export function NotificationTestPanel() {
  const [busyChannel, setBusyChannel] = useState<Channel | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { t } = useI18n();

  async function handleTest(channel: Channel) {
    setBusyChannel(channel);
    setMessage('');
    setError('');

    try {
      setMessage(await sendTestNotification(channel));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('testError'));
    } finally {
      setBusyChannel(null);
    }
  }

  return (
    <section className="panel notification-test-panel">
      <div className="section-heading">
        <p>{t('check')}</p>
        <h2>{t('notificationTest')}</h2>
      </div>
      <div className="test-actions">
        <button type="button" className="secondary-button" disabled={busyChannel !== null} onClick={() => handleTest('telegram')}>
          {busyChannel === 'telegram' ? t('sending') : t('testTelegram')}
        </button>
        <button type="button" className="secondary-button" disabled={busyChannel !== null} onClick={() => handleTest('push')}>
          {busyChannel === 'push' ? t('sending') : t('testPush')}
        </button>
      </div>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="message">{error}</p>}
    </section>
  );
}
