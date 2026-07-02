import { useNavigate } from 'react-router-dom';
import { WelcomePage } from '../components/WelcomePage';

export function HomePage() {
  const navigate = useNavigate();

  return <WelcomePage onConnectCard={() => navigate('/auth')} />;
}
