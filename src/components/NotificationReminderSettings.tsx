import { useEffect, useState } from 'react';
import {
  loadNotificationPreferences,
  reminderDayOptions,
  saveNotificationPreferences,
  type ReminderDay,
} from '../lib/notificationPreferences';

function labelForDay(day: ReminderDay) {
  if (day === 0) return 'В день списания';
  if (day === 1) return 'За 1 день';
  return 'За 2 дня';
}

export function NotificationReminderSettings() {
  const [days, setDays] = useState<ReminderDay[]>([1, 0]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadNotificationPreferences()
      .then(setDays)
      .catch(() => setMessage('Не получилось загрузить настройки напоминаний.'));
  }, []);

  async function toggleDay(day: ReminderDay) {
    const nextDays = days.includes(day)
      ? days.filter((item) => item !== day)
      : [...days, day].sort((left, right) => right - left);

    if (nextDays.length === 0) {
      setMessage('Оставьте хотя бы одно напоминание.');
      return;
    }

    setBusy(true);
    setMessage('');

    try {
      await saveNotificationPreferences(nextDays);
      setDays(nextDays);
      setMessage('Настройки напоминаний сохранены.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не получилось сохранить настройки.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel reminder-settings-panel">
      <div className="section-heading">
        <p>Alerts</p>
        <h2>Когда напоминать</h2>
      </div>
      <p className="helper-text">Эти настройки работают и для Telegram, и для push на телефон.</p>
      <div className="reminder-options">
        {reminderDayOptions.map((day) => (
          <label key={day}>
            <input
              type="checkbox"
              checked={days.includes(day)}
              disabled={busy}
              onChange={() => toggleDay(day)}
            />
            <span>{labelForDay(day)}</span>
          </label>
        ))}
      </div>
      {message && <p className={message.includes('сохран') ? 'success-message' : 'message'}>{message}</p>}
    </section>
  );
}
