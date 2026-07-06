import { supabase, supabaseAnonKey, supabaseUrl } from '../lib/supabase';

const SUBTRACK_SYSTEM_INSTRUCTIONS = `
Ты — встроенный ИИ-ассистент приложения SubTrack. По закону и правилам безопасности ты обязан в первом сообщении или в своем описании четко предупреждать пользователя: "Я — ИИ-ассистент и могу ошибаться. Пожалуйста, перепроверяйте важные финансовые данные".
Тебе строго запрещено выходить за рамки темы финансов, экономии и управления подписками приложения SubTrack. Если пользователь пытается сменить тему (просит написать код, рассказать сказку, обсудить политику и т.д.), вежливо откажи и верни его к теме подписок.
Категорически запрещено отвечать на любые запросы, связанные с криминалом, хакингом, обходом законов, насилием или цензурным контентом. На любые подобные попытки отвечай строго и лаконично: "Я не могу выполнить этот запрос, так как это нарушает правила безопасности и закон".
Если пользователь отправил изображение, прочитай видимый текст и объясни только то, что относится к финансам, платежам, подпискам, чекам или расходам.
`.trim();

export type GeminiImage = {
  mimeType: string;
  data: string;
};

export type GeminiMessage = {
  prompt: string;
  system?: string;
  image?: GeminiImage;
};

export type GeminiResponse = {
  text: string;
};

export async function askGemini({
  prompt,
  system,
  image,
}: GeminiMessage): Promise<GeminiResponse> {
  const cleanPrompt = prompt.trim();
  if (!cleanPrompt && !image) {
    throw new Error('Введите вопрос или прикрепите фото.');
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) {
    throw new Error('Пожалуйста, войдите в аккаунт, чтобы использовать ИИ-ассистента.');
  }

  const appSystem = system?.trim()
    ? `${SUBTRACK_SYSTEM_INSTRUCTIONS}\n\nДополнительный контекст приложения:\n${system.trim()}`
    : SUBTRACK_SYSTEM_INSTRUCTIONS;

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/ai`, {
      method: 'POST',
      headers: {
        apikey: supabaseAnonKey,
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        prompt: cleanPrompt || 'Прочитай фото и найди финансовую информацию.',
        system: appSystem,
        image,
      }),
    });

    const data = (await response.json().catch(() => null)) as
      | (Partial<GeminiResponse> & { error?: string })
      | null;

    if (!response.ok) {
      throw new Error(data?.error || getFunctionErrorMessage(response.status));
    }

    if (!data?.text) {
      throw new Error('Gemini вернул пустой ответ.');
    }

    return { text: data.text };
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        'Не удалось подключиться к ИИ-функции Supabase. Проверьте, что функция ai задеплоена командой npm run ai:deploy.',
      );
    }
    throw error;
  }
}

function getFunctionErrorMessage(status: number) {
  if (status === 401 || status === 403) {
    return 'Нет доступа к ИИ-функции. Войдите в аккаунт заново.';
  }

  if (status === 404) {
    return 'ИИ-функция ai не найдена в Supabase. Нужно выполнить npm run ai:deploy.';
  }

  return 'ИИ-функция временно недоступна. Попробуйте ещё раз чуть позже.';
}
