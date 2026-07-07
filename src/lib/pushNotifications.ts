import { supabase } from './supabase';

const fallbackVapidPublicKey =
  'BNG8U97sxDXAVCgPmoB-fleAtW5dIDheGATHvSYz3_Pv5W-upz5aZDLl0etdXmY5Lgb0k-uo10g3wwB_XFJktVU';
const publicKey = (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined) || fallbackVapidPublicKey;

type SavedPushSubscription = {
  endpoint?: string;
  expirationTime?: number | null;
  keys?: {
    auth?: string;
    p256dh?: string;
  };
};

export function canUsePushNotifications() {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}

export function getPushPermission() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

function base64UrlToUint8Array(value: string) {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = `${value}${padding}`.replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

async function saveSubscription(subscription: PushSubscription) {
  const data = subscription.toJSON() as SavedPushSubscription;
  const endpoint = data.endpoint;
  const auth = data.keys?.auth;
  const p256dh = data.keys?.p256dh;

  if (!endpoint || !auth || !p256dh) {
    throw new Error('Браузер не вернул ключи push-подписки.');
  }

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      auth,
      endpoint,
      expiration_time: data.expirationTime ? new Date(data.expirationTime).toISOString() : null,
      p256dh,
      user_agent: navigator.userAgent,
    },
    { onConflict: 'endpoint' },
  );

  if (error) throw error;
}

export async function enablePushNotifications() {
  if (!canUsePushNotifications()) {
    throw new Error('Этот браузер не поддерживает push-уведомления.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return permission;

  const registration = await navigator.serviceWorker.register('/sw.js');
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      applicationServerKey: base64UrlToUint8Array(publicKey),
      userVisibleOnly: true,
    }));

  await saveSubscription(subscription);
  return permission;
}
