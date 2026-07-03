import { FormEvent, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { askGemini } from '../services/gemini';
import type { Subscription } from '../lib/subscriptions';

type Message = {
  id: string;
  role: 'assistant' | 'user';
  text: string;
};

type Props = {
  session: Session | null;
  subscriptions: Subscription[];
};

const initialMessage: Message = {
  id: 'welcome',
  role: 'assistant',
  text:
    'Я — ИИ-ассистент и могу ошибаться. Пожалуйста, перепроверяйте важные финансовые данные. Могу помочь найти лишние подписки и идеи для экономии.',
};

export function AiAssistantChat({ session, subscriptions }: Props) {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  if (!session?.user) {
    return (
      <section className="ai-chat-panel ai-chat-locked">
        <p className="ai-chat-kicker">SubTrack AI</p>
        <h2>ИИ-помощник</h2>
        <p>Пожалуйста, войдите в аккаунт, чтобы использовать ИИ-ассистента.</p>
      </section>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = input.trim();
    if (!question || isSending) return;

    const userMessage: Message = createMessage('user', question);
    setMessages((current) => [...current, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      const answer = await askGemini({
        prompt: question,
        system: buildSubscriptionContext(subscriptions),
      });
      setMessages((current) => [...current, createMessage('assistant', answer.text)]);
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Не получилось получить ответ.';
      setMessages((current) => [...current, createMessage('assistant', text)]);
    } finally {
      setIsSending(false);
      window.setTimeout(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
      }, 0);
    }
  }

  return (
    <section className="ai-chat-panel" aria-label="ИИ-ассистент SubTrack">
      <div className="ai-chat-header">
        <div>
          <p className="ai-chat-kicker">SubTrack AI</p>
          <h2>Финансовый помощник</h2>
        </div>
        <span>online</span>
      </div>
      <p className="ai-chat-warning">
        ⚠️ ИИ-ассистент может ошибаться. Перепроверяйте важные данные.
      </p>
      <div className="ai-chat-messages" ref={listRef}>
        {messages.map((message) => (
          <article className={`ai-message ${message.role}`} key={message.id}>
            {message.text}
          </article>
        ))}
        {isSending && <article className="ai-message assistant">Думаю над ответом...</article>}
      </div>
      <form className="ai-chat-form" onSubmit={handleSubmit}>
        <input
          aria-label="Сообщение для ИИ-ассистента"
          placeholder="Спросите про подписки..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
        <button aria-label="Отправить сообщение" disabled={isSending || !input.trim()} type="submit">
          &gt;
        </button>
      </form>
    </section>
  );
}

function buildSubscriptionContext(subscriptions: Subscription[]) {
  if (subscriptions.length === 0) {
    return 'У пользователя пока нет добавленных подписок.';
  }

  return subscriptions
    .map((item) => `${item.name}: ${item.cost} ₸, дата списания ${item.chargeDate}`)
    .join('\n');
}

function createMessage(role: Message['role'], text: string): Message {
  return {
    id: crypto.randomUUID(),
    role,
    text,
  };
}
