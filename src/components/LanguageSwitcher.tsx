import { useI18n, type Language } from '../lib/i18n';

const languages: Array<{ label: string; value: Language }> = [
  { label: 'RU', value: 'ru' },
  { label: 'EN', value: 'en' },
  { label: 'KZ', value: 'kk' },
];

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();

  return (
    <div className="language-switcher" aria-label={t('language')}>
      {languages.map((item) => (
        <button
          className={item.value === language ? 'active' : ''}
          key={item.value}
          type="button"
          onClick={() => setLanguage(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
