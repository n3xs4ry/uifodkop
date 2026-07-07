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
  const [notice, setNotice] = useState('');
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

    const attachedImage = image;
    setNotice('');
    addMessage('user', attachedImage ? `${question || 'Прочитай фото'}\nФото: ${imageName}` : question);
    setInput('');
    setIsSending(true);

    try {
      if (attachedImage && wantsPhotoSubscriptionAdd(question)) {
        await addSubscriptionFromImage(attachedImage);
        return;
      }

      const answer = await askGemini({
        prompt: question,
        image: attachedImage ?? undefined,
        system: buildSubscriptionContext(subscriptions),
      });
      addMessage('assistant', answer.text);
      clearImage();
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
      setNotice('Фото прикреплено. Напишите "добавь подписку" или нажмите "Фото → подписка".');
    } catch (error) {
      addMessage('assistant', error instanceof Error ? error.message : 'Не удалось прочитать фото.');
    }
  }

  async function handleExtractSubscription() {
    if (!image || isSending) return;

    const attachedImage = image;
    setIsSending(true);
    setDraft(null);
    setNotice('');
    addMessage('user', `Добавь подписку из фото: ${imageName}`);

    try {
      await addSubscriptionFromImage(attachedImage);
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
      showResult(`Готово, подписка "${draft.name}" добавлена.`);
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

  async function addSubscriptionFromImage(attachedImage: GeminiImage) {
    const nextDraft = await extractSubscriptionDraft(attachedImage, subscriptions);

    if (nextDraft.confidence < 0.45) {
      setDraft(nextDraft);
      showResult('Я не до конца уверен в данных. Проверь карточку ниже и нажми "Добавить".');
      return;
    }

    await onAddSubscription(nextDraft);
    showResult(`Готово, я сам добавил подписку "${nextDraft.name}" на сумму ${nextDraft.cost} ${nextDraft.currency}.`);
    clearImage();
  }

  function showResult(text: string) {
    setNotice(text);
    addMessage('assistant', text);
  }

  function wantsPhotoSubscriptionAdd(text: string) {
    const normalized = text.toLowerCase();
    const addWords = ['добав', 'созда', 'сохран', 'запиши', 'внеси', 'add', 'create', 'save'];
    const subscriptionWords = ['подпис', 'subscription', 'subtrack'];
    return addWords.some((word) => normalized.includes(word)) &&
      subscriptionWords.some((word) => normalized.includes(word));
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
    notice,
    setInput,
    setIsOpen,
  };
}
