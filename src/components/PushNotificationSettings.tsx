import { useEffect, useState } from 'react';
import {
  canUsePushNotifications,
  enablePushNotifications,
  getPushPermission,
} from '../lib/pushNotifications';
import { useI18n } from '../lib/i18n';

type PermissionState = NotificationPermission | 'unsupported';

export function PushNotificationSettings() {
  const [permission, setPermission] = useState<PermissionState>('default');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { t } = useI18n();

  useEffect(() => {
    setPermission(getPushPermission());
  }, []);

  function statusText() {
    if (permission === 'granted') return t('pushEnabled');
    if (permission === 'denied') return t('pushDenied');
    if (permission === 'unsupported') return t('pushUnsupported');
    return t('pushDefault');
  }

  async function handleEnable() {
    setBusy(true);
    setError('');

    try {
      setPermission(await enablePushNotifications());
    } catch (err) {
      setError(err instanceof Error ? err.message : t('pushError'));
    } finally {
      setBusy(false);
    }
  }

  const disabled = busy || permission === 'granted' || permission === 'denied' || !canUsePushNotifications();

  return (
    <section className="panel push-panel">
      <div className="section-heading">
        <p>Push</p>
        <h2>{statusText()}</h2>
      </div>
      <button type="button" className="secondary-button" disabled={disabled} onClick={handleEnable}>
        {busy ? t('enabling') : t('enablePush')}
      </button>
      {error && <p className="message">{error}</p>}
    </section>
  );
}
