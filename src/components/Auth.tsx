import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useI18n } from '../lib/i18n';

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

  return (
    <section className="auth-panel">
      <div>
        <p className="eyebrow">{t('authLabel')}</p>
        <h1>{mode === 'signin' ? t('signInTitle') : t('signUpTitle')}</h1>
        <p>{t('authHint')}</p>
      </div>
      <form className="auth-form" onSubmit={handleSubmit}>
        <input type="email" placeholder="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <input
          type="password"
          minLength={6}
          placeholder={t('passwordPlaceholder')}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <button type="submit" disabled={busy}>{busy ? t('wait') : mode === 'signin' ? t('signIn') : t('create')}</button>
      </form>
      {message && <p className="message">{message}</p>}
      <button className="ghost-button auth-switch" type="button" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
        {mode === 'signin' ? t('switchToSignUp') : t('switchToSignIn')}
      </button>
    </section>
  );
}
