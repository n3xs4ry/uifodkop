import type { Subscription } from './subscriptions';

export type AiMessage = {
  id: string;
  role: 'assistant' | 'user';
  text: string;
};

export const initialAiMessage: AiMessage = {
  id: 'welcome',
  role: 'assistant',
  text:
    'Я — ИИ-ассистент и могу ошибаться. Пожалуйста, перепроверяйте важные финансовые данные. Могу найти повторяющиеся платежи по скрину выписки.',
};

export const bankImportPrompt =
  'Проанализируй скрин банковской выписки. Найди повторяющиеся платежи, похожие на подписки. Для каждого кандидата укажи название, сумму, даты/частоту, уверенность и стоит ли добавить в SubTrack.';

export function buildSubscriptionContext(subscriptions: Subscription[]) {
  if (subscriptions.length === 0) return 'У пользователя пока нет добавленных подписок.';
  return subscriptions
    .map((item) => `${item.name}: ${item.cost} ${item.currency}, дата списания ${item.chargeDate}`)
    .join('\n');
}

export function createAiMessage(role: AiMessage['role'], text: string): AiMessage {
  return { id: crypto.randomUUID(), role, text };
}
