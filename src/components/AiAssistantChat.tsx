import { ChangeEvent, FormEvent, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { askGemini, type GeminiImage } from '../services/gemini';
import {
  bankImportPrompt,
  buildSubscriptionContext,
  createAiMessage,
  initialAiMessage,
  type AiMessage,
} from '../lib/aiAssistant';
import { readImageAttachment } from '../lib/imageAttachment';
import type { Subscription } from '../lib/subscriptions';

type Props = {
  session: Session | null;
  subscriptions: Subscription[];
};

export function AiAssistantChat({ session, subscriptions }: Props) {
  const [messages, setMessages] = useState<AiMessage[]>([initialAiMessage]);
  const [input, setInput] = useState('');
  const [image, setImage] = useState<GeminiImage | null>(null);
  const [imageName, setImageName] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  if (!session?.user) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = input.trim();
    if ((!question && !image) || isSending) return;

    const userText = image ? `${question || 'Прочитай фото'}\nФото: ${imageName}` : question;
    setMessages((current) => [...current, createAiMessage('user', userText)]);
    setInput('');
    setImage(null);
    setImageName('');
    setIsSending(true);

    try {
      const answer = await askGemini({
        prompt: question,
        image: image ?? undefined,
        system: buildSubscriptionContext(subscriptions),
      });
      setMessages((current) => [...current, createAiMessage('assistant', answer.text)]);
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Не получилось получить ответ.';
      setMessages((current) => [...current, createAiMessage('assistant', text)]);
    } finally {
      setIsSending(false);
      window.setTimeout(scrollToBottom, 0);
    }
  }

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const nextImage = await readImageAttachment(file);
      setImage(nextImage);
      setImageName(file.name);
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Не удалось прочитать фото.';
      setMessages((current) => [...current, createAiMessage('assistant', text)]);
    }
  }

  function scrollToBottom() {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }

  return (
    <>
      <button className="ai-floating-trigger" type="button" onClick={() => setIsOpen(true)}>
        <span className="ai-logo-mark">AI</span>
        <span>Assistant</span>
      </button>
      {isOpen && (
        <section className="ai-chat-panel ai-chat-window" aria-label="ИИ-ассистент SubTrack">
          <div className="ai-chat-header">
            <div className="ai-chat-title">
              <span className="ai-logo-mark">AI</span>
              <div>
                <p className="ai-chat-kicker">SubTrack AI</p>
                <h2>Финансовый помощник</h2>
              </div>
            </div>
            <button className="ai-close-button" type="button" onClick={() => setIsOpen(false)}>
              ×
            </button>
          </div>
          <p className="ai-chat-warning">⚠️ ИИ-ассистент может ошибаться. Перепроверяйте важные данные.</p>
          <button className="ai-import-button" type="button" onClick={() => setInput(bankImportPrompt)}>
            Импорт выписки
          </button>
          <div className="ai-chat-messages" ref={listRef}>
            {messages.map((message) => (
              <article className={`ai-message ${message.role}`} key={message.id}>
                {message.text}
              </article>
            ))}
            {isSending && <article className="ai-message assistant">Думаю над ответом...</article>}
          </div>
          {imageName && (
            <button className="ai-image-chip" type="button" onClick={() => setImage(null)}>
              Фото: {imageName} ×
            </button>
          )}
          <form className="ai-chat-form" onSubmit={handleSubmit}>
            <label className="ai-attach-button" title="Прикрепить фото">
              +
              <input accept="image/jpeg,image/png,image/webp" type="file" onChange={handleImageChange} />
            </label>
            <input
              aria-label="Сообщение для ИИ-ассистента"
              placeholder="Спросите или отправьте фото..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
            />
            <button aria-label="Отправить сообщение" disabled={isSending || (!input.trim() && !image)} type="submit">
              &gt;
            </button>
          </form>
        </section>
      )}
    </>
  );
}
