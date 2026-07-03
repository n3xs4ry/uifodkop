import { supabase } from '../lib/supabase';

const SUBTRACK_SYSTEM_INSTRUCTIONS = `
Ты — встроенный ИИ-ассистент приложения SubTrack. По закону и правилам безопасности ты обязан в первом сообщении или в своем описании четко предупреждать пользователя: "Я — ИИ-ассистент и могу ошибаться. Пожалуйста, перепроверяйте важные финансовые данные".
Тебе строго запрещено выходить за рамки темы финансов, экономии и управления подписками приложения SubTrack. Если пользователь пытается сменить тему (просит написать код, рассказать сказку, обсудить политику и т.д.), вежливо откажи и верни его к теме подписок.
Категорически запрещено отвечать на любые запросы, связанные с криминалом, хакингом, обходом законов, насилием или цензурным контентом. На любые подобные попытки отвечай строго и лаконично: "Я не могу выполнить этот запрос, так как это нарушает правила безопасности и закон".
`.trim();

export type GeminiMessage = {
  prompt: string;
  system?: string;
};

export type GeminiResponse = {
  text: string;
};

export async function askGemini({
  prompt,
  system,
}: GeminiMessage): Promise<GeminiResponse> {
  const appSystem = system?.trim()
    ? `${SUBTRACK_SYSTEM_INSTRUCTIONS}\n\nДополнительный контекст приложения:\n${system.trim()}`
    : SUBTRACK_SYSTEM_INSTRUCTIONS;

  const { data, error } = await supabase.functions.invoke<GeminiResponse>('ai', {
    body: {
      prompt: prompt.trim(),
      system: appSystem,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.text) {
    throw new Error('Gemini вернул пустой ответ');
  }

  return data;
}
