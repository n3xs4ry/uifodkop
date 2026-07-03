import type { Session } from '@supabase/supabase-js';
import { Dashboard } from '../components/Dashboard';

type Props = {
  session: Session | null;
};

export function DashboardPage({ session }: Props) {
  return <Dashboard session={session} />;
}
