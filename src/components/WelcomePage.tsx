import { useI18n } from '../lib/i18n';

type WelcomePageProps = {
  onConnectCard: () => void;
};

const steps = [
  { number: '01', textKey: 'taskTrackText', titleKey: 'taskTrackTitle' },
  { number: '02', textKey: 'taskNotifyText', titleKey: 'taskNotifyTitle' },
  { number: '03', textKey: 'taskSaveText', titleKey: 'taskSaveTitle' },
] as const;

export function WelcomePage({ onConnectCard }: WelcomePageProps) {
  const { t } = useI18n();

  return (
    <section className="welcome-page">
      <div className="welcome-copy">
        <p className="eyebrow">Sub Tracker</p>
        <h1>{t('welcomeTitle')}</h1>
        <p className="hero-copy">{t('welcomeCopy')}</p>
        <div className="welcome-actions">
          <button type="button" onClick={onConnectCard}>
            {t('connectCard')}
          </button>
          <span>{t('cardHint')}</span>
        </div>
      </div>
      <div className="welcome-tasks">
        {steps.map((step) => (
          <article key={step.number}>
            <strong>{step.number}</strong>
            <h2>{t(step.titleKey)}</h2>
            <p>{t(step.textKey)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
