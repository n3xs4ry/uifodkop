import type { Language } from './i18n';

const kkMonths = [
  'қаңтар',
  'ақпан',
  'наурыз',
  'сәуір',
  'мамыр',
  'маусым',
  'шілде',
  'тамыз',
  'қыркүйек',
  'қазан',
  'қараша',
  'желтоқсан',
];

export function formatMonthName(date: Date, language: Language, locale: string) {
  if (language === 'kk') return kkMonths[date.getMonth()];
  return date.toLocaleDateString(locale, { month: 'long' });
}

export function formatLongDate(value: string, language: Language, locale: string) {
  const date = new Date(`${value}T00:00:00`);

  if (language === 'kk') {
    return `${date.getDate()} ${kkMonths[date.getMonth()]}`;
  }

  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
  });
}
