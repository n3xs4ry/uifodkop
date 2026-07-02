import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { WelcomePage } from './components/WelcomePage';
import { supabase } from './lib/supabase';
import { useI18n } from './lib/i18n';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) setShowAuth(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <main className="app-shell">
        <section className="panel loading-panel">{t('loading')}</section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <strong>Sub Tracker</strong>
          <span>{t('appSubtitle')}</span>
        </div>
        <div className="topbar-actions">
          <LanguageSwitcher />
          {session ? (
            <button className="ghost-button" type="button" onClick={() => supabase.auth.signOut()}>
              {t('signOut')}
            </button>
          ) : (
            <button className="ghost-button auth-top-button" type="button" onClick={() => setShowAuth((isOpen) => !isOpen)}>
              {showAuth ? t('back') : t('signIn')}
            </button>
          )}
        </div>
      </header>
      {session ? <Dashboard /> : showAuth ? <Auth /> : <WelcomePage onConnectCard={() => setShowAuth(true)} />}
    </main>
  );
}
