import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AppHeader } from './components/AppHeader';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { HomePage } from './pages/HomePage';
import { supabase } from './lib/supabase';
import { useI18n } from './lib/i18n';

function AppLayout({ session }: { session: Session | null }) {
  return (
    <main className="app-shell">
      <AppHeader session={session} />
      <Outlet />
    </main>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
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
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout session={session} />}>
          <Route index element={session ? <Navigate replace to="/dashboard" /> : <HomePage />} />
          <Route path="auth" element={session ? <Navigate replace to="/dashboard" /> : <AuthPage />} />
          <Route
            path="dashboard"
            element={session ? <DashboardPage session={session} /> : <Navigate replace to="/auth" />}
          />
          <Route path="*" element={<Navigate replace to={session ? '/dashboard' : '/'} />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
