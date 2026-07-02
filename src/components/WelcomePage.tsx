import { useI18n } from '../lib/i18n';

type WelcomePageProps = {
  onConnectCard: () => void;
};

const taskIcons = ['coins', 'bell', 'cloud'] as const;

function AnimatedTitle({ text }: { text: string }) {
  return (
    <span className="animated-title" aria-label={text}>
      {Array.from(text).map((letter, index) => (
        <span
          aria-hidden="true"
          key={`${letter}-${index}`}
          style={{ animationDelay: `${index * 0.035}s` }}
        >
          {letter === ' ' ? '\u00a0' : letter}
        </span>
      ))}
    </span>
  );
}

function TaskIcon({ type }: { type: (typeof taskIcons)[number] }) {
  if (type === 'coins') {
    return (
      <span className="task-icon coins-icon" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    );
  }

  if (type === 'bell') {
    return (
      <span className="task-icon bell-icon" aria-hidden="true">
        <i />
      </span>
    );
  }

  return (
    <span className="task-icon cloud-icon" aria-hidden="true">
      <i />
    </span>
  );
}

export function WelcomePage({ onConnectCard }: WelcomePageProps) {
  const { t } = useI18n();

  return (
    <section className="welcome-page">
      <div className="welcome-copy">
        <p className="eyebrow">Sub Tracker</p>
        <h1>
          <AnimatedTitle text={t('welcomeTitle')} />
        </h1>
        <p className="hero-copy">{t('welcomeCopy')}</p>
        <div className="welcome-actions">
          <button type="button" onClick={onConnectCard}>
            {t('connectCard')}
          </button>
          <strong>{t('cardHint')}</strong>
        </div>
        <div className="welcome-tasks">
          <article className="task-panel task-panel-coins">
            <TaskIcon type={taskIcons[0]} />
            <strong>01</strong>
            <h2>{t('taskTrackTitle')}</h2>
            <p>{t('taskTrackText')}</p>
          </article>
          <article className="task-panel task-panel-bell">
            <TaskIcon type={taskIcons[1]} />
            <strong>02</strong>
            <h2>{t('taskNotifyTitle')}</h2>
            <p>{t('taskNotifyText')}</p>
          </article>
          <article className="task-panel task-panel-cloud">
            <TaskIcon type={taskIcons[2]} />
            <strong>03</strong>
            <h2>{t('taskSaveTitle')}</h2>
            <p>{t('taskSaveText')}</p>
          </article>
        </div>
      </div>
      <aside className="welcome-card-preview" aria-label={t('cardPreviewLabel')}>
        <span>{t('cardPreviewLabel')}</span>
        <strong>**** 2486</strong>
        <p>{t('cardPreviewText')}</p>
      </aside>
    </section>
  );
}
