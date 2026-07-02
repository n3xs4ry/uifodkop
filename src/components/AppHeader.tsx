import type { Session } from '@supabase/supabase-js';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LanguageSwitcher } from './LanguageSwitcher';
import { supabase } from '../lib/supabase';
import { useI18n } from '../lib/i18n';

type Props = {
  session: Session | null;
};

export function AppHeader({ session }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  const isAuthPage = location.pathname === '/auth';

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/');
  }

  return (
    <header className="topbar">
      <Link className="brand-link" to={session ? '/dashboard' : '/'}>
        <strong>Sub Tracker</strong>
        <span>{t('appSubtitle')}</span>
      </Link>
      <div className="topbar-actions">
        <LanguageSwitcher />
        {session ? (
          <button className="ghost-button" type="button" onClick={handleSignOut}>
            {t('signOut')}
          </button>
        ) : (
          <Link className="ghost-button auth-top-button" to={isAuthPage ? '/' : '/auth'}>
            {isAuthPage ? t('back') : t('signIn')}
          </Link>
        )}
      </div>
    </header>
  );
}
