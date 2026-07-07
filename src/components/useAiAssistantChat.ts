import { ChangeEvent, FormEvent, useRef, useState } from 'react';
import { askGemini, type GeminiImage } from '../services/gemini';
import {
  buildSubscriptionContext,
  createAiMessage,
  initialAiMessage,
  type AiMessage,
} from '../lib/aiAssistant';
import { extractSubscriptionDraft, type SubscriptionDraft } from '../lib/aiSubscriptionImport';
import { readImageAttachment } from '../lib/imageAttachment';
import type { NewSubscription, Subscription } from '../lib/subscriptions';

type Params = {
  subscriptions: Subscription[];
  onAddSubscription: (subscription: NewSubscription) => Promise<void>;
};

export function useAiAssistantChat({ subscriptions, onAddSubscription }: Params) {
  const [messages, setMessages] = useState<AiMessage[]>([initialAiMessage]);
  const [input, setInput] = useState('');
  const [image, setImage] = useState<GeminiImage | null>(null);
  const [imageName, setImageName] = useState('');
  const [draft, setDraft] = useState<SubscriptionDraft | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  function scrollToBottom() {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = input.trim();
    if ((!question && !image) || isSending) return;

    addMessage('user', image ? `${question || 'Прочитай фото'}\nФото: ${imageName}` : question);
    setInput('');
    clearImage();
    setIsSending(true);

    try {
      const answer = await askGemini({
        prompt: question,
        image: image ?? undefined,
        system: buildSubscriptionContext(subscriptions),
      });
      addMessage('assistant', answer.text);
    } catch (error) {
      addMessage('assistant', error instanceof Error ? error.message : 'Не получилось получить ответ.');
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
      setImage(await readImageAttachment(file));
      setImageName(file.name);
      setDraft(null);
    } catch (error) {
      addMessage('assistant', error instanceof Error ? error.message : 'Не удалось прочитать фото.');
    }
  }

  async function handleExtractSubscription() {
    if (!image || isSending) return;

    setIsSending(true);
    setDraft(null);
    addMessage('user', `Добавь подписку из фото: ${imageName}`);

    try {
      const nextDraft = await extractSubscriptionDraft(image, subscriptions);
      setDraft(nextDraft);
      addMessage('assistant', 'Я нашел подписку на фото. Проверь данные ниже и нажми "Добавить".');
    } catch (error) {
      addMessage('assistant', error instanceof Error ? error.message : 'Не получилось распознать подписку на фото.');
    } finally {
      setIsSending(false);
      window.setTimeout(scrollToBottom, 0);
    }
  }

  async function handleAddDraft() {
    if (!draft || isSavingDraft) return;

    setIsSavingDraft(true);
    try {
      await onAddSubscription(draft);
      addMessage('assistant', `Готово, подписка "${draft.name}" добавлена.`);
      clearImage();
    } catch (error) {
      addMessage('assistant', error instanceof Error ? error.message : 'Не получилось добавить подписку.');
    } finally {
      setIsSavingDraft(false);
    }
  }

  function clearImage() {
    setImage(null);
    setImageName('');
    setDraft(null);
  }

  function addMessage(role: AiMessage['role'], text: string) {
    setMessages((current) => [...current, createAiMessage(role, text)]);
  }

  return {
    clearImage,
    draft,
    handleAddDraft,
    handleExtractSubscription,
    handleImageChange,
    handleSubmit,
    image,
    imageName,
    input,
    isOpen,
    isSavingDraft,
    isSending,
    listRef,
    messages,
    setInput,
    setIsOpen,
  };
}
