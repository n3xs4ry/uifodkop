import { useEffect, useState } from 'react';
import {
  createTelegramConnectLink,
  loadTelegramConnection,
  type TelegramConnectData,
  type TelegramConnection,
} from '../lib/telegram';
import { useI18n } from '../lib/i18n';

export function TelegramNotificationSettings() {
  const [connection, setConnection] = useState<TelegramConnection | null>(null);
  const [connectData, setConnectData] = useState<TelegramConnectData | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const { t } = useI18n();

  async function refresh() {
    setConnection(await loadTelegramConnection());
  }

  useEffect(() => {
    refresh().catch((err) => {
      setError(err instanceof Error ? err.message : t('telegramCheckError'));
    });
  }, []);

  async function handleConnect() {
    setBusy(true);
    setError('');

    try {
      const nextConnectData = await createTelegramConnectLink();
      setConnectData(nextConnectData);
      setCopied(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('telegramOpenError'));
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy() {
    if (!connectData) return;

    try {
      await navigator.clipboard.writeText(connectData.startCommand);
      setCopied(true);
    } catch {
      setError(t('copyError'));
    }
  }

  return (
    <section className="panel notification-panel">
      <div className="section-heading">
        <p>Telegram</p>
        <h2>{connection ? t('telegramConnected') : t('telegramAlerts')}</h2>
      </div>
      <p className="helper-text">
        {connection
          ? t('telegramConnectedHint', { chat: connection.chatTitle ?? 'chat' })
          : t('telegramHint')}
      </p>
      <button type="button" className="secondary-button" disabled={busy} onClick={handleConnect}>
        {busy ? t('openBot') : connection ? t('reconnectTelegram') : t('connectTelegram')}
      </button>
      {connectData && (
        <div className="telegram-fallback">
          <p>{t('telegramCommandHint')}</p>
          <code>{connectData.startCommand}</code>
          <div className="telegram-actions">
            <button type="button" className="secondary-button" onClick={handleCopy}>
              {copied ? t('copied') : t('copyCommand')}
            </button>
            <a href={connectData.appLink}>{t('openApp')}</a>
            <a href={connectData.webLink} target="_blank" rel="noreferrer">
              {t('openTme')}
            </a>
          </div>
        </div>
      )}
      {error && <p className="message">{error}</p>}
    </section>
  );
}
