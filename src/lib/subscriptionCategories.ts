import type { Subscription } from './subscriptions';

export type CategoryKey = 'ai' | 'education' | 'games' | 'music' | 'other' | 'video';

const categoryMatchers: Record<CategoryKey, string[]> = {
  ai: ['chatgpt', 'openai', 'midjourney', 'notion ai', 'gemini'],
  education: ['coursera', 'duolingo', 'udemy', 'skillbox', 'stepik', 'study'],
  games: ['game', 'steam', 'playstation', 'xbox', 'minecraft', 'roblox'],
  music: ['spotify', 'apple music', 'yandex music', 'soundcloud', 'music'],
  other: [],
  video: ['netflix', 'youtube', 'ivi', 'kinopoisk', 'disney', 'prime', 'video'],
};

export type CategorySummary = {
  key: CategoryKey;
  total: number;
  count: number;
};

export function getSubscriptionCategory(subscription: Subscription): CategoryKey {
  const normalizedName = subscription.name.toLowerCase();
  const match = (Object.keys(categoryMatchers) as CategoryKey[]).find((category) =>
    categoryMatchers[category].some((item) => normalizedName.includes(item)),
  );

  return match ?? 'other';
}

export function summarizeCategories(subscriptions: Subscription[]) {
  const summary = new Map<CategoryKey, CategorySummary>();

  subscriptions.forEach((subscription) => {
    const key = getSubscriptionCategory(subscription);
    const current = summary.get(key) ?? { key, total: 0, count: 0 };
    summary.set(key, {
      ...current,
      count: current.count + 1,
      total: current.total + subscription.cost,
    });
  });

  return [...summary.values()].sort((a, b) => b.total - a.total);
}
