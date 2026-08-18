import { useEffect, useRef, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router';
import { GameLoadingWindow } from './components/game-loading-window.tsx';
import { DownloadsGame } from './games/downloads-game.tsx';
import { PhishingGame } from './games/phishing-game.tsx';
import { PrivacyGame } from './games/privacy-game.tsx';
import { authClient } from './lib/auth-client.ts';
import { AuthPage } from './pages/auth-page.tsx';
import { LandingPage } from './pages/landing-page.tsx';
import { PublicLandingPage } from './pages/public-landing-page.tsx';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const session = authClient.useSession();
  const location = useLocation();
  if (session.isPending) return <GameLoadingWindow message="Memeriksa sesi pemain…" title="JEJAK" />;
  if (!session.data) return <Navigate replace state={{ from: location.pathname }} to="/login" />;
  return children;
}

export function App() {
  const location = useLocation();
  const buttonClickAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    function handleButtonClick(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest('button');
      if (!button || button.disabled) return;
      const audio = buttonClickAudioRef.current ?? new Audio('/assets/Audio/buttonclick.mp3');
      buttonClickAudioRef.current = audio;
      audio.currentTime = 0;
      void audio.play().catch(() => undefined);
    }

    document.addEventListener('click', handleButtonClick);
    return () => document.removeEventListener('click', handleButtonClick);
  }, []);

  useEffect(() => {
    document.querySelector<HTMLElement>('main')?.focus({ preventScroll: true });
  }, [location.pathname]);

  return (
    <>
      <a className="skip-link" href="#main-route">Lewati ke konten</a>
      <div id="main-route">
        <Routes>
          <Route element={<PublicLandingPage />} path="/" />
          <Route element={<AuthPage mode="login" />} path="/login" />
          <Route element={<AuthPage mode="register" />} path="/register" />
          <Route element={<LandingPage />} path="/home" />
          <Route element={<ProtectedRoute><PrivacyGame /></ProtectedRoute>} path="/game/privacy" />
          <Route element={<ProtectedRoute><PrivacyGame /></ProtectedRoute>} path="/game/privacy/:publicId" />
          <Route element={<ProtectedRoute><PhishingGame /></ProtectedRoute>} path="/game/phishing" />
          <Route element={<ProtectedRoute><PhishingGame /></ProtectedRoute>} path="/game/phishing/:publicId" />
          <Route element={<ProtectedRoute><DownloadsGame /></ProtectedRoute>} path="/game/downloads" />
          <Route element={<ProtectedRoute><DownloadsGame /></ProtectedRoute>} path="/game/downloads/:publicId" />
          <Route element={<Navigate replace to="/" />} path="*" />
        </Routes>
      </div>
    </>
  );
}
