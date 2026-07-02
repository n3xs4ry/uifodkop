import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useI18n } from '../lib/i18n';

const guestCredentialsKey = 'sub-tracker-guest-credentials';

type GuestCredentials = {
  email: string;
  password: string;
};

function createGuestCredentials(): GuestCredentials {
  const id = crypto.randomUUID().replace(/-/g, '').slice(0, 18);
  return {
    email: `guest${id}@gmail.com`,
    password: crypto.randomUUID(),
  };
}

function loadGuestCredentials() {
  const saved = localStorage.getItem(guestCredentialsKey);
  if (!saved) return null;

  try {
    return JSON.parse(saved) as GuestCredentials;
  } catch {
    return null;
  }
}

function forgetGuestCredentials() {
  localStorage.removeItem(guestCredentialsKey);
}

export function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const { t } = useI18n();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage('');

    const request =
      mode === 'signup'
        ? supabase.auth.signUp({ email, password })
        : supabase.auth.signInWithPassword({ email, password });

    const { error } = await request;
    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (mode === 'signup') setMessage(t('accountCreated'));
  }

  async function handleGuest() {
    setBusy(true);
    setMessage('');

    try {
      const savedCredentials = loadGuestCredentials();

      if (savedCredentials) {
        const { error } = await supabase.auth.signInWithPassword(savedCredentials);
        if (!error) return;
        forgetGuestCredentials();
      }

      const nextCredentials = createGuestCredentials();
      const { data, error } = await supabase.auth.signUp(nextCredentials);

      if (!error && data.session) {
        localStorage.setItem(guestCredentialsKey, JSON.stringify(nextCredentials));
        return;
      }

      if (!error && !data.session) {
        const { error: signInError } = await supabase.auth.signInWithPassword(nextCredentials);
        if (!signInError) {
          localStorage.setItem(guestCredentialsKey, JSON.stringify(nextCredentials));
          return;
        }
      }

      const { error: anonymousError } = await supabase.auth.signInAnonymously();
      if (anonymousError) throw anonymousError;
    } catch {
      setMessage(t('guestError'));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleSignIn() {
    setBusy(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    setBusy(false);

    if (error) {
      setMessage(error.message);
    }
  }

  return (
    <section className="auth-panel">
      <div>
        <p className="eyebrow">{t('authLabel')}</p>
        <h1>{mode === 'signin' ? t('signInTitle') : t('signUpTitle')}</h1>
        <p>{t('authHint')}</p>
      </div>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label>
          {t('password')}
          <input
            type="password"
            minLength={6}
            placeholder={t('passwordPlaceholder')}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={busy}>{busy ? t('wait') : mode === 'signin' ? t('signIn') : t('create')}</button>
      </form>
      <button className="secondary-button google-button" type="button" disabled={busy} onClick={handleGoogleSignIn}>
        {busy ? t('wait') : 'Google'}
      </button>
      {message && <p className="message">{message}</p>}
      <button className="secondary-button guest-button" type="button" disabled={busy} onClick={handleGuest}>
        {busy ? t('wait') : t('continueAsGuest')}
      </button>
      <p className="auth-note">{t('guestHint')}</p>
      <button className="ghost-button auth-switch" type="button" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
        {mode === 'signin' ? t('switchToSignUp') : t('switchToSignIn')}
      </button>
    </section>
  );
}
