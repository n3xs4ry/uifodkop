import type { GeminiImage } from '../services/gemini';

const maxImageSize = 4 * 1024 * 1024;
const imageTypes = ['image/jpeg', 'image/png', 'image/webp'];

export async function readImageAttachment(file: File): Promise<GeminiImage> {
  if (!imageTypes.includes(file.type)) {
    throw new Error('Можно отправлять только JPG, PNG или WEBP.');
  }

  if (file.size > maxImageSize) {
    throw new Error('Фото слишком большое. Максимум — 4 МБ.');
  }

  return {
    mimeType: file.type,
    data: await readImageAsBase64(file),
  };
}

function readImageAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = () => reject(new Error('Не удалось прочитать фото.'));
    reader.readAsDataURL(file);
  });
}
