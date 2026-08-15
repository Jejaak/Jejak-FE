import { Navigate } from 'react-router';

interface AuthPageProps {
  mode: 'login' | 'register';
}

export function AuthPage({ mode }: AuthPageProps) {
  return <Navigate replace state={{ authMode: mode, openBrowser: true }} to="/" />;
}
