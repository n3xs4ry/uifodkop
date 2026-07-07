import type { Session } from '@supabase/supabase-js';
import { bankImportPrompt } from '../lib/aiAssistant';
import type { NewSubscription, Subscription } from '../lib/subscriptions';
import { AiSubscriptionDraftCard } from './AiSubscriptionDraftCard';
import { useAiAssistantChat } from './useAiAssistantChat';

type Props = {
  session: Session | null;
  subscriptions: Subscription[];
  onAddSubscription: (subscription: NewSubscription) => Promise<void>;
};

export function AiAssistantChat({ session, subscriptions, onAddSubscription }: Props) {
  const chat = useAiAssistantChat({ subscriptions, onAddSubscription });

  if (!session?.user) return null;

  return (
    <>
      <button className="ai-floating-trigger" type="button" onClick={() => chat.setIsOpen(true)}>
        <span className="ai-logo-mark">AI</span>
        <span>Assistant</span>
      </button>
      {chat.isOpen && (
        <section className="ai-chat-panel ai-chat-window" aria-label="ИИ-ассистент SubTrack">
          <div className="ai-chat-header">
            <div className="ai-chat-title">
              <span className="ai-logo-mark">AI</span>
              <div>
                <p className="ai-chat-kicker">SubTrack AI</p>
                <h2>Финансовый помощник</h2>
              </div>
            </div>
            <button className="ai-close-button" type="button" onClick={() => chat.setIsOpen(false)}>
              ×
            </button>
          </div>
          <p className="ai-chat-warning">⚠️ ИИ-ассистент может ошибаться. Перепроверяйте важные данные.</p>
          <div className="ai-import-actions">
            <button className="ai-import-button" type="button" onClick={() => chat.setInput(bankImportPrompt)}>
              Импорт выписки
            </button>
            <button
              className="ai-import-button"
              type="button"
              onClick={chat.handleExtractSubscription}
              disabled={!chat.image || chat.isSending}
            >
              Фото → подписка
            </button>
          </div>
          <div className="ai-chat-messages" ref={chat.listRef}>
            {chat.messages.map((message) => (
              <article className={`ai-message ${message.role}`} key={message.id}>
                {message.text}
              </article>
            ))}
            {chat.isSending && <article className="ai-message assistant">Думаю над ответом...</article>}
          </div>
          {chat.imageName && (
            <button className="ai-image-chip" type="button" onClick={chat.clearImage}>
              Фото: {chat.imageName} ×
            </button>
          )}
          {chat.draft && (
            <AiSubscriptionDraftCard
              draft={chat.draft}
              isSaving={chat.isSavingDraft}
              onAdd={chat.handleAddDraft}
              onCancel={chat.clearImage}
            />
          )}
          <form className="ai-chat-form" onSubmit={chat.handleSubmit}>
            <label className="ai-attach-button" title="Прикрепить фото">
              +
              <input accept="image/jpeg,image/png,image/webp" type="file" onChange={chat.handleImageChange} />
            </label>
            <input
              aria-label="Сообщение для ИИ-ассистента"
              placeholder="Спросите или отправьте фото..."
              value={chat.input}
              onChange={(event) => chat.setInput(event.target.value)}
            />
            <button
              aria-label="Отправить сообщение"
              disabled={chat.isSending || (!chat.input.trim() && !chat.image)}
              type="submit"
            >
              &gt;
            </button>
          </form>
        </section>
      )}
    </>
  );
}
