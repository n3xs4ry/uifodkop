import { askGemini, type GeminiImage } from '../services/gemini';
import { normalizeCurrency } from './currency';
import type { NewSubscription, Subscription } from './subscriptions';

type AiDraftResponse = {
  found?: boolean;
  name?: string;
  cost?: number | string;
  currency?: string;
  chargeDate?: string;
  confidence?: number;
  note?: string;
};

export type SubscriptionDraft = NewSubscription & {
  confidence: number;
  note: string;
};

export async function extractSubscriptionDraft(
  image: GeminiImage,
  subscriptions: Subscription[],
): Promise<SubscriptionDraft> {
  const answer = await askGemini({
    image,
    prompt: createExtractionPrompt(subscriptions),
    system: 'Верни только JSON для импорта подписки. Не добавляй markdown и пояснения вне JSON.',
  });

  return normalizeDraft(parseJson(answer.text));
}

function createExtractionPrompt(subscriptions: Subscription[]) {
  const existing = subscriptions.map((item) => `${item.name} ${item.cost} ${item.currency}`).join(', ');

  return `
Прочитай фото чека, банковской выписки или скриншота оплаты.
Найди одну самую вероятную подписку/регулярный платеж для добавления в SubTrack.
Если это не подписка или данных мало, поставь found=false.

Текущие подписки пользователя: ${existing || 'нет'}.

Ответь строго JSON:
{
  "found": true,
  "name": "Netflix",
  "cost": 12.99,
  "currency": "USD",
  "chargeDate": "2026-07-07",
  "confidence": 0.82,
  "note": "Коротко почему это похоже на подписку"
}

Правила:
- currency только KZT, USD, EUR, GBP, TRY или RUB.
- chargeDate в формате YYYY-MM-DD. Если точной даты нет, используй дату платежа на фото.
- cost только число без пробелов и символов валюты.
`.trim();
}

function parseJson(text: string): AiDraftResponse {
  const clean = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '');
  const match = clean.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('ИИ не смог вернуть данные подписки в правильном формате.');

  const parsed = JSON.parse(match[0]) as unknown;
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('ИИ не нашел подписку на фото.');
  }

  return parsed as AiDraftResponse;
}

function normalizeDraft(draft: AiDraftResponse): SubscriptionDraft {
  if (draft.found === false) throw new Error('На фото не получилось уверенно найти подписку.');

  const name = typeof draft.name === 'string' ? draft.name.trim() : '';
  const cost = Number(draft.cost);
  const chargeDate = typeof draft.chargeDate === 'string' ? draft.chargeDate.trim() : '';
  const confidence = Number(draft.confidence ?? 0.6);

  if (!name || !Number.isFinite(cost) || cost <= 0 || !isValidDate(chargeDate)) {
    throw new Error('ИИ прочитал фото, но данных недостаточно для добавления подписки.');
  }

  return {
    name,
    cost,
    chargeDate,
    currency: normalizeCurrency(draft.currency),
    confidence: Math.min(1, Math.max(0, confidence)),
    note: typeof draft.note === 'string' ? draft.note.trim() : 'Проверьте данные перед добавлением.',
  };
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return !Number.isNaN(new Date(`${value}T00:00:00`).getTime());
}
