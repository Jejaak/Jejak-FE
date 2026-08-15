import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useNavigate, useParams } from 'react-router';
import { GameLoadingWindow } from '../components/game-loading-window.tsx';
import { Lives } from '../components/lives.tsx';
import { apiUrl, websocketUrl } from '../lib/api.ts';
import { authClient } from '../lib/auth-client.ts';
import { postCompletedRun } from '../lib/progress.ts';
import { downloadProgress, DOWNLOAD_DURATION_MS } from './download-timing.ts';

interface VirusFile {
  id: string;
  name: string;
  asset: string;
  suspicious?: boolean;
  position: number;
  resolved: boolean;
}

interface VirusSession {
  id: string;
  publicId: string;
  status: 'ACTIVE' | 'WON' | 'LOST' | 'ABANDONED';
  safeCount: number;
  mistakes: number;
  startedAt: string;
  completedAt: string | null;
  files: VirusFile[];
}

interface VirusActionResult {
  session: VirusSession;
  correct: boolean;
  fileName: string;
}

const safeTarget = 15;
const maxMistakes = 3;
const tutorialSlides = [
  { focus: 'intro', mascot: '/assets/Shared/Mascots/Mascot_Shocked.png', content: <>Waduh! Ada banyak file yang menuju ke komputer!</> },
  { focus: 'warning', mascot: '/assets/Shared/Mascots/Mascot_Neutral.png', content: <>Tidak semua file aman, bisa aja <strong className="tutorial-pink">virus yang menyamar.</strong></> },
  { focus: 'inspect', mascot: '/assets/Shared/Mascots/Mascot_Neutral.png', content: <>Coba perhatikan <strong className="tutorial-cyan">nama dan ekstensi file</strong> dengan teliti.</> },
  { focus: 'suspicious', mascot: '/assets/Shared/Mascots/Mascot_Neutral.png', content: <>Jika ada file yang terlihat <strong className="tutorial-pink">mencurigakan...</strong></> },
  { focus: 'delete', mascot: '/assets/Shared/Mascots/Mascot_Neutral.png', content: <><strong className="tutorial-cyan">Klik</strong> untuk menghapusnya!</> },
  { focus: 'safe', mascot: '/assets/Shared/Mascots/Mascot_Happy.png', content: <>Tapi jangan hapus file yang aman!</> },
  { focus: 'finish', mascot: '/assets/Shared/Mascots/Mascot_Happy.png', content: <>Good luck! Lindungi komputer dari virus.</> },
] as const;

async function startVirusSession(): Promise<VirusSession> {
  const response = await fetch(apiUrl('/api/v1/virus-sessions'), {
    method: 'POST',
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Sesi Virus tidak dapat dimuat.');
  return (await response.json() as { data: VirusSession }).data;
}

async function abandonVirusSession(sessionId: string, keepalive = false): Promise<void> {
  const response = await fetch(apiUrl(`/api/v1/virus-sessions/${sessionId}/abandon`), {
    method: 'POST',
    credentials: 'include',
    keepalive,
  });
  if (!response.ok && response.status !== 404) throw new Error('Sesi Virus tidak dapat ditutup.');
}

async function getActiveVirusSession(publicId: string): Promise<VirusSession> {
  const response = await fetch(apiUrl(`/api/v1/virus-sessions/public/${publicId}`), { credentials: 'include', cache: 'no-store' });
  if (!response.ok) throw new Error('Sesi Virus sudah berakhir atau tidak tersedia.');
  return (await response.json() as { data: VirusSession }).data;
}

const fileOrigins = [
  { x: 16, y: 20 },
  { x: 50, y: 12 },
  { x: 84, y: 20 },
] as const;

function randomWaveSize(maximum: number): number {
  return Math.min(maximum, 1 + Math.floor(Math.random() * 3));
}

export function DownloadsGame({ onExit }: { onExit?: () => void }) {
  const auth = authClient.useSession();
  const navigate = useNavigate();
  const { publicId } = useParams<{ publicId: string }>();
  const reduceMotion = useReducedMotion();
  const sessionRef = useRef<VirusSession | null>(null);
  const activeFileIdsRef = useRef<string[]>([]);
  const fileStartedAtRef = useRef(new Map<string, number>());
  const resolvingFileIdsRef = useRef(new Set<string>());
  const pendingEffectsRef = useRef(new Map<string, { safe: number; mistakes: number }>());
  const pendingFilesRef = useRef(new Map<string, VirusFile>());
  const socketRef = useRef<WebSocket | null>(null);
  const exitingRef = useRef(false);
  const hiddenAtRef = useRef<number | null>(null);
  const gamePausedRef = useRef(false);
  const pauseStartedAtRef = useRef<number | null>(null);
  const waveSizeRef = useRef(1);
  const [session, setSession] = useState<VirusSession | null>(null);
  const [displaySafeCount, setDisplaySafeCount] = useState(0);
  const [displayMistakes, setDisplayMistakes] = useState(0);
  const [activeFileIds, setActiveFileIds] = useState<string[]>([]);
  const [fileProgress, setFileProgress] = useState<Record<string, number>>({});
  const [tutorialStep, setTutorialStep] = useState<number | null>(null);
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const result = session?.status === 'LOST' || displayMistakes >= maxMistakes
    ? 'lost'
    : session?.status === 'WON' || displaySafeCount >= safeTarget
      ? 'won'
      : null;
  const tutorial = tutorialStep === null ? null : tutorialSlides[tutorialStep];
  const activeFiles = activeFileIds.flatMap((id) => {
    const file = session?.files.find((candidate) => candidate.id === id && !candidate.resolved);
    return file ? [file] : [];
  });
  const overallProgress = activeFiles.reduce((highest, file) => Math.max(highest, fileProgress[file.id] ?? 0), 0);

  function syncDisplayedScore(loadedSession: VirusSession) {
    let pendingSafe = 0;
    let pendingMistakes = 0;
    for (const effect of pendingEffectsRef.current.values()) {
      pendingSafe += effect.safe;
      pendingMistakes += effect.mistakes;
    }
    setDisplaySafeCount(Math.min(safeTarget, loadedSession.safeCount + pendingSafe));
    setDisplayMistakes(Math.min(maxMistakes, loadedSession.mistakes + pendingMistakes));
  }

  const startWave = useCallback((loadedSession: VirusSession) => {
    const unresolved = loadedSession.files.filter((file) => !file.resolved);
    const size = randomWaveSize(unresolved.length);
    const ids = unresolved.slice(0, size).map((file) => file.id);
    const now = performance.now();
    waveSizeRef.current = size;
    activeFileIdsRef.current = ids;
    fileStartedAtRef.current = new Map(ids.map((id) => [id, now]));
    setActiveFileIds(ids);
    setFileProgress(Object.fromEntries(ids.map((id) => [id, 0])));
  }, []);

  useEffect(() => {
    function abandonOnPageHide() {
      const currentSession = sessionRef.current;
      if (currentSession?.status === 'ACTIVE' && !exitingRef.current) void abandonVirusSession(currentSession.id, true);
    }
    window.addEventListener('pagehide', abandonOnPageHide);
    return () => window.removeEventListener('pagehide', abandonOnPageHide);
  }, []);

  useEffect(() => {
    if (!auth.data) return;
    if (!publicId) {
      void startVirusSession()
        .then((createdSession) => navigate(`/game/downloads/${createdSession.publicId}`, { replace: true }))
        .catch((loadError: unknown) => {
          setError(loadError instanceof Error ? loadError.message : 'Sesi Virus tidak dapat dibuat.');
          setLoading(false);
        });
      return;
    }

    let active = true;
    void getActiveVirusSession(publicId)
      .then((loadedSession) => {
        if (!active) return;
        sessionRef.current = loadedSession;
        resolvingFileIdsRef.current.clear();
        pendingEffectsRef.current.clear();
        pendingFilesRef.current.clear();
        setSession(loadedSession);
        syncDisplayedScore(loadedSession);

        const socket = new WebSocket(websocketUrl(`/api/v1/ws/virus-sessions/${publicId}`));
        socketRef.current = socket;
        socket.addEventListener('open', () => {
          if (!active) return;
          gamePausedRef.current = false;
          pauseStartedAtRef.current = null;
          startWave(loadedSession);
          setLoading(false);
        });
        socket.addEventListener('message', (event) => {
          const message = JSON.parse(String(event.data)) as {
            type: string;
            requestId?: string;
            message?: string;
            data?: VirusSession | VirusActionResult;
          };
          if (message.type === 'session' && message.data) {
            const nextSession = message.data as VirusSession;
            sessionRef.current = nextSession;
            setSession(nextSession);
            syncDisplayedScore(nextSession);
            return;
          }
          if (message.type === 'action_result' && message.requestId && message.data) {
            const response = message.data as VirusActionResult;
            resolvingFileIdsRef.current.delete(message.requestId);
            pendingEffectsRef.current.delete(message.requestId);
            pendingFilesRef.current.delete(message.requestId);
            sessionRef.current = response.session;
            setSession(response.session);
            syncDisplayedScore(response.session);
            const unresolvedIds = new Set(response.session.files.filter((candidate) => !candidate.resolved).map((candidate) => candidate.id));
            activeFileIdsRef.current = activeFileIdsRef.current.filter((id) => unresolvedIds.has(id));
            setActiveFileIds([...activeFileIdsRef.current]);
            const candidates = response.session.files.filter((candidate) =>
              !candidate.resolved &&
              !activeFileIdsRef.current.includes(candidate.id) &&
              !resolvingFileIdsRef.current.has(candidate.id),
            );
            const replacements = response.session.status === 'ACTIVE'
              ? candidates.slice(0, Math.max(0, waveSizeRef.current - activeFileIdsRef.current.length))
              : [];
            if (replacements.length > 0) {
              activeFileIdsRef.current = [...activeFileIdsRef.current, ...replacements.map((replacement) => replacement.id)];
              const now = performance.now();
              for (const replacement of replacements) fileStartedAtRef.current.set(replacement.id, now);
              setActiveFileIds([...activeFileIdsRef.current]);
              setFileProgress((current) => ({ ...current, ...Object.fromEntries(replacements.map((replacement) => [replacement.id, 0])) }));
            }
            if (response.session.status === 'WON') {
              const durationMs = Math.max(1, Date.now() - new Date(response.session.startedAt).getTime());
              void postCompletedRun({ mode: 'DOWNLOADS', score: response.session.safeCount, maxScore: safeTarget, mistakes: response.session.mistakes, durationMs }, true);
            }
            return;
          }
          if (message.type === 'session_ended') {
            sessionRef.current = sessionRef.current ? { ...sessionRef.current, status: 'ABANDONED' } : null;
            if (!exitingRef.current) navigate('/', { replace: true });
            return;
          }
          if (message.type === 'action_error' && message.requestId) {
            const failedFile = pendingFilesRef.current.get(message.requestId);
            resolvingFileIdsRef.current.delete(message.requestId);
            pendingEffectsRef.current.delete(message.requestId);
            pendingFilesRef.current.delete(message.requestId);
            if (sessionRef.current) syncDisplayedScore(sessionRef.current);
            if (failedFile && sessionRef.current?.status === 'ACTIVE') {
              activeFileIdsRef.current = [...activeFileIdsRef.current, failedFile.id];
              fileStartedAtRef.current.set(failedFile.id, performance.now());
              setActiveFileIds([...activeFileIdsRef.current]);
              setFileProgress((current) => ({ ...current, [failedFile.id]: 0 }));
            }
            setError(message.message ?? 'Keputusan file tidak dapat disimpan.');
          }
        });
        socket.addEventListener('error', () => setError('Koneksi realtime Virus terputus.'));
        socket.addEventListener('close', (event) => {
          if (active && event.code !== 1000) setError('Sesi Virus sudah berakhir atau koneksi terputus.');
        });
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Sesi Virus tidak dapat dimuat.');
          setLoading(false);
        }
      });

    return () => {
      active = false;
      const currentSession = sessionRef.current;
      if (currentSession?.status === 'ACTIVE' && !exitingRef.current) void abandonVirusSession(currentSession.id, true);
      gamePausedRef.current = false;
      pauseStartedAtRef.current = null;
      exitingRef.current = false;
      activeFileIdsRef.current = [];
      fileStartedAtRef.current.clear();
      socketRef.current?.close(1000, 'Page left');
      socketRef.current = null;
    };
  }, [auth.data, navigate, onExit, publicId, startWave]);

  const decide = useCallback((file: VirusFile, action: 'ALLOW' | 'BLOCK') => {
    if (!sessionRef.current || resolvingFileIdsRef.current.has(file.id)) return;
    resolvingFileIdsRef.current.add(file.id);
    const suspicious = file.suspicious ?? file.id.startsWith('bad-');
    const correct = action === (suspicious ? 'BLOCK' : 'ALLOW');
    const effect = {
      safe: Number(correct && !suspicious),
      mistakes: Number(!correct),
    };
    pendingEffectsRef.current.set(file.id, effect);
    pendingFilesRef.current.set(file.id, file);
    setDisplaySafeCount((current) => Math.min(safeTarget, current + effect.safe));
    setDisplayMistakes((current) => Math.min(maxMistakes, current + effect.mistakes));
    activeFileIdsRef.current = activeFileIdsRef.current.filter((id) => id !== file.id);
    fileStartedAtRef.current.delete(file.id);
    setActiveFileIds([...activeFileIdsRef.current]);
    setFileProgress((current) => Object.fromEntries(Object.entries(current).filter(([id]) => id !== file.id)));
    setError(null);

    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      resolvingFileIdsRef.current.delete(file.id);
      pendingEffectsRef.current.delete(file.id);
      pendingFilesRef.current.delete(file.id);
      if (sessionRef.current) syncDisplayedScore(sessionRef.current);
      activeFileIdsRef.current = [...activeFileIdsRef.current, file.id];
      fileStartedAtRef.current.set(file.id, performance.now());
      setActiveFileIds([...activeFileIdsRef.current]);
      setFileProgress((current) => ({ ...current, [file.id]: 0 }));
      setError('Koneksi realtime belum siap. Coba lagi.');
      return;
    }
    socket.send(JSON.stringify({ type: 'action', requestId: file.id, fileId: file.id, action }));
  }, []);

  useEffect(() => {
    if (tutorialStep !== null || result || activeFiles.length === 0) return undefined;

    function handleVisibility() {
      if (document.hidden) hiddenAtRef.current = performance.now();
      else if (hiddenAtRef.current !== null) {
        const pausedFor = performance.now() - hiddenAtRef.current;
        for (const [id, startedAt] of fileStartedAtRef.current) fileStartedAtRef.current.set(id, startedAt + pausedFor);
        hiddenAtRef.current = null;
      }
    }

    const timer = window.setInterval(() => {
      if (document.hidden || gamePausedRef.current) return;
      const now = performance.now();
      const nextProgress: Record<string, number> = {};
      let completedFile: VirusFile | null = null;
      for (const file of activeFiles) {
        const startedAt = fileStartedAtRef.current.get(file.id) ?? now;
        const progress = downloadProgress(now, startedAt, DOWNLOAD_DURATION_MS);
        nextProgress[file.id] = progress;
        if (progress >= 88 && completedFile === null) completedFile = file;
      }
      setFileProgress((current) => ({ ...current, ...nextProgress }));
      if (completedFile) void decide(completedFile, 'ALLOW');
    }, 100);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [activeFiles, decide, result, tutorialStep]);

  function pauseGame() {
    if (gamePausedRef.current) return;
    gamePausedRef.current = true;
    pauseStartedAtRef.current = performance.now();
  }

  function resumeGame() {
    if (!gamePausedRef.current) return;
    if (pauseStartedAtRef.current !== null) {
      const pausedFor = performance.now() - pauseStartedAtRef.current;
      for (const [id, startedAt] of fileStartedAtRef.current) fileStartedAtRef.current.set(id, startedAt + pausedFor);
    }
    pauseStartedAtRef.current = null;
    gamePausedRef.current = false;
  }

  function openExitConfirm() {
    pauseGame();
    setExitConfirmOpen(true);
  }

  function closeExitConfirm() {
    setExitConfirmOpen(false);
    resumeGame();
  }

  async function exitGame() {
    if (exitingRef.current) return;
    exitingRef.current = true;
    setExiting(true);
    gamePausedRef.current = true;
    const currentSession = sessionRef.current;
    try {
      if (currentSession?.status === 'ACTIVE') {
        if (socketRef.current?.readyState === WebSocket.OPEN) socketRef.current.send(JSON.stringify({ type: 'abandon' }));
        await abandonVirusSession(currentSession.id);
        sessionRef.current = { ...currentSession, status: 'ABANDONED' };
      }
      if (onExit) onExit();
      else navigate('/', { replace: true });
    } catch (exitError) {
      exitingRef.current = false;
      setExiting(false);
      setError(exitError instanceof Error ? exitError.message : 'Sesi Virus tidak dapat ditutup.');
    }
  }

  function openTutorial() {
    pauseGame();
    setTutorialStep(0);
  }

  function advanceTutorial() {
    setTutorialStep((step) => {
      if (step === null || step < tutorialSlides.length - 1) return step === null ? null : step + 1;
      resumeGame();
      return null;
    });
  }

  function reset() {
    navigate('/game/downloads', { replace: true });
  }

  if (loading || !session) {
    return <GameLoadingWindow error={error} message={publicId ? 'Memuat sesi unduhan…' : 'Membuat sesi unduhan…'} onBack={() => navigate('/')} onRetry={error ? () => window.location.reload() : undefined} sessionId={publicId} title="VIRUS.EXE" />;
  }

  if (result) {
    const won = result === 'won';
    return (
      <main className="game-stage downloads-stage centered" tabIndex={-1}>
        <div className="privacy-answer-backdrop virus-final-backdrop">
          <section aria-live="polite" className={`privacy-answer-popup ${won ? 'is-correct' : 'is-wrong'}`}>
            <img alt="Maskot JEJAK" src={won ? '/assets/Shared/Mascots/Mascot_Happy.png' : '/assets/Shared/Mascots/Mascot_Cry.png'} />
            <div>
              <p>{won ? 'PILIHAN AMAN' : 'HATI-HATI'}</p>
              <h2>{won ? 'Komputer aman!' : 'Komputer terinfeksi!'}</h2>
              <p>{won ? '15 file aman berhasil mencapai komputer.' : 'HP habis karena file berbahaya mencapai komputer.'}</p>
              <div className="button-row"><button className="virus-result-primary" onClick={reset} type="button">Main lagi</button><button className="virus-result-secondary" disabled={exiting} onClick={() => void exitGame()} type="button">{exiting ? 'Menutup sesi...' : 'Kembali ke home'}</button></div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className={`virus-game-screen ${tutorial ? 'virus-tutorial-open' : ''}`} tabIndex={-1}>
      <h1 className="sr-only">Virus</h1>
      <div className="virus-hud">
        <div className="virus-hud-left"><Lives compact current={maxMistakes - displayMistakes} /><span className="virus-session-id">{session.publicId}</span></div>
        <div className="virus-actions">
          <span>{displaySafeCount}/{safeTarget} file aman</span>
          <button aria-label="Buka tutorial" onClick={openTutorial} type="button"><img alt="" aria-hidden="true" src="/assets/Shared/Game/ButtonInfo.png" /></button>
          <button aria-label="Keluar dari game" disabled={exiting} onClick={openExitConfirm} type="button"><img alt="" aria-hidden="true" src="/assets/Shared/Game/ButtonClose.png" /></button>
        </div>
      </div>

      <img alt="Maskot JEJAK menunggu file" className="virus-target-mascot" src="/assets/Shared/Mascots/Mascot_Busy.png" />
      <section aria-label="File yang sedang diunduh" className="virus-download-area">
        {activeFiles.map((file) => {
          const progress = fileProgress[file.id] ?? 0;
          const origin = fileOrigins[file.position % fileOrigins.length] ?? fileOrigins[0];
          const ratio = progress / 100;
          const left = origin.x + (50 - origin.x) * ratio;
          const top = origin.y + (82 - origin.y) * ratio;
          return (
            <motion.button
              animate={{ left: `${left}%`, top: `${top}%` }}
              aria-label={`Hapus ${file.name}`}
              className="virus-moving-file"
              key={file.id}
              onClick={() => void decide(file, 'BLOCK')}
              transition={{ duration: reduceMotion ? 0 : .1, ease: 'linear' }}
              type="button"
            >
              <img alt="" aria-hidden="true" src={file.asset} />
              <strong>{file.name}</strong>
            </motion.button>
          );
        })}
      </section>

      <div className="virus-progress-window">
        <img alt="" aria-hidden="true" src="/assets/Game3/FileTerunduhBox.png" />
        <div aria-label="Progres file terdepan" aria-valuemax={100} aria-valuemin={0} aria-valuenow={overallProgress} className="virus-progress-bar" role="progressbar"><span style={{ width: `${overallProgress}%` }} /></div>
      </div>
      {error && <p className="virus-error" role="alert">{error}</p>}

      {exitConfirmOpen && <div className="privacy-exit-backdrop"><section aria-labelledby="virus-exit-title" aria-modal="true" className="privacy-exit-dialog" role="dialog"><img alt="Maskot JEJAK" src="/assets/Shared/Mascots/Mascot_Shocked.png" /><div><h2 id="virus-exit-title">Keluar dari permainan?</h2><p>Progres sesi Virus ini akan dihapus dan ID sesi tidak dapat digunakan kembali.</p><div><button disabled={exiting} onClick={() => void exitGame()} type="button">{exiting ? 'Menutup sesi...' : 'Ya, keluar'}</button><button disabled={exiting} onClick={closeExitConfirm} type="button">Lanjut bermain</button></div></div></section></div>}

      {tutorial && (
        <button aria-label={`Lanjutkan tutorial, langkah ${(tutorialStep ?? 0) + 1} dari 7`} className={`virus-tutorial-backdrop virus-tutorial-${tutorial.focus}`} onClick={advanceTutorial} type="button">
          <div aria-hidden="true" className="virus-tutorial-files">
            <div className="virus-tutorial-bad-file"><img src="/assets/Shared/Game/FileZip.png" /><span>ROBUX-GRATIS.exe</span>{tutorial.focus === 'delete' && <span className="virus-tutorial-delete-marker"><img src="/assets/Shared/Game/x.png" /><img src="/assets/Shared/Tutorial/Cursor.png" /></span>}</div>
            <div><img src="/assets/Shared/Game/FileText.png" /><span>tugas-sekolah.docx</span></div>
          </div>
          <section aria-labelledby="virus-tutorial-title" className="virus-tutorial-panel">
            <img alt="Maskot JEJAK" className="virus-tutorial-mascot" src={tutorial.mascot} />
            <div className="virus-tutorial-copy">
              <span aria-hidden="true" className="virus-tutorial-window-bar">□ □ ×</span>
              <h2 id="virus-tutorial-title">{tutorial.content}</h2>
              <span>{(tutorialStep ?? 0) + 1}/7 · Klik di mana saja untuk lanjut</span>
            </div>
          </section>
        </button>
      )}
    </main>
  );
}
