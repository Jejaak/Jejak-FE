import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useNavigate, useParams } from 'react-router';
import { GameLoadingWindow } from '../components/game-loading-window.tsx';
import { GameResult } from '../components/game-result.tsx';
import { Lives } from '../components/lives.tsx';
import { abandonPrivacySession, answerPrivacyQuestion, completePrivacyTutorial, getPrivacySession, privacySocketUrl, startPrivacySession, type PrivacyAnswerResult, type PrivacyChoice, type PrivacyRealtimeEvent, type PrivacySession } from '../lib/privacy-session.ts';

interface TutorialSlide {
  mascot: string;
  focus: string;
  content: ReactNode;
}

const privacyAbandonTimers = new Map<string, number>();

const tutorialSlides: TutorialSlide[] = [
  { mascot: '/assets/Shared/Mascots/Mascot_Shocked.png', focus: 'intro', content: <>Di internet, <strong className="tutorial-pink">tidak semua informasi aman dibagikan!</strong></> },
  { mascot: '/assets/Shared/Mascots/Mascot_Neutral.png', focus: 'character', content: <>Lihat dulu, <strong className="tutorial-cyan">siapa yang meminta?</strong></> },
  { mascot: '/assets/Shared/Mascots/Mascot_Busy.png', focus: 'dialogue', content: <>Pikirkan juga, apa yang mereka minta dan <strong className="tutorial-pink">untuk apa?</strong></> },
  { mascot: '/assets/Shared/Mascots/Mascot_Neutral.png', focus: 'decision', content: <>Apakah kamu seharusnya bagi <strong className="tutorial-cyan">info ini?</strong></> },
  { mascot: '/assets/Shared/Mascots/Mascot_Happy.png', focus: 'choices', content: <><strong className="tutorial-cyan">Kalau kamu yakin,</strong> pilih dari tombol di bawah!</> },
  { mascot: '/assets/Shared/Mascots/Mascot_Busy.png', focus: 'reject', content: <>Kalau ragu, <strong className="tutorial-pink">lebih aman Tolak!</strong></> },
];

export function PrivacyGame({ onExit }: { onExit?: () => void }) {
  const navigate = useNavigate();
  const { publicId } = useParams<{ publicId: string }>();
  const reduceMotion = useReducedMotion();
  const socketRef = useRef<WebSocket | null>(null);
  const pendingSocketAnswersRef = useRef(new Map<string, { resolve: (result: PrivacyAnswerResult) => void; reject: () => void; timer: number }>());
  const reconnectTimerRef = useRef<number | null>(null);
  const intentionalExitRef = useRef(false);
  const [gameSession, setGameSession] = useState<PrivacySession | null>(null);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [answerResult, setAnswerResult] = useState<PrivacyAnswerResult | null>(null);
  const [tutorialStep, setTutorialStep] = useState<number | null>(null);
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ type: 'saving' | 'error'; message: string } | null>(null);
  const [lastChoice, setLastChoice] = useState<PrivacyChoice | null>(null);
  const [socketState, setSocketState] = useState<'connecting' | 'connected' | 'offline'>('connecting');

  const question = gameSession?.questions[scenarioIndex];
  const tutorial = tutorialStep === null ? null : tutorialSlides[tutorialStep];
  const finished = gameSession?.status === 'COMPLETED';
  const lost = gameSession?.status === 'LOST';

  async function loadSession() {
    setLoading(true);
    setError('');
    setSocketState('connecting');
    try {
      if (!publicId) {
        const created = await startPrivacySession();
        navigate(`/game/privacy/${created.publicId}`, { replace: true });
        return;
      }
      const result = await getPrivacySession(publicId);
      setGameSession(result);
      setScenarioIndex(Math.min(result.answeredCount, result.questionCount - 1));
      if (result.tutorialRequired) setTutorialStep(0);
      setAnswerResult(null);
      setInfoOpen(false);
    } catch {
      setError('Game Privasi tidak dapat dimuat. Pastikan backend aktif lalu coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setLoading(true);
      setError('');
    });
    if (!publicId) {
      void startPrivacySession()
        .then((result) => {
          if (active) navigate(`/game/privacy/${result.publicId}`, { replace: true });
        })
        .catch(() => {
          if (!active) return;
          setError('Game Privasi tidak dapat dimuat. Pastikan backend aktif lalu coba lagi.');
          setLoading(false);
        });
      return () => {
        active = false;
      };
    }
    void getPrivacySession(publicId)
      .then((result) => {
        if (!active) return;
        setGameSession(result);
        setScenarioIndex(Math.min(result.answeredCount, result.questionCount - 1));
        if (result.tutorialRequired) setTutorialStep(0);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setError('Game Privasi tidak dapat dimuat. Pastikan backend aktif lalu coba lagi.');
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [navigate, publicId]);

  useEffect(() => {
    const sessionId = gameSession?.id;
    if (!sessionId || gameSession.status !== 'ACTIVE') return;
    const activeSessionId = sessionId;
    const pendingTimer = privacyAbandonTimers.get(activeSessionId);
    if (pendingTimer !== undefined) {
      window.clearTimeout(pendingTimer);
      privacyAbandonTimers.delete(activeSessionId);
    }
    function abandonOnPageHide() {
      if (!intentionalExitRef.current) void abandonPrivacySession(activeSessionId).catch(() => undefined);
    }
    window.addEventListener('pagehide', abandonOnPageHide);
    return () => {
      window.removeEventListener('pagehide', abandonOnPageHide);
      if (intentionalExitRef.current) return;
      const timer = window.setTimeout(() => {
        privacyAbandonTimers.delete(activeSessionId);
        void abandonPrivacySession(activeSessionId).catch(() => undefined);
      }, 0);
      privacyAbandonTimers.set(activeSessionId, timer);
    };
  }, [gameSession?.id, gameSession?.status]);

  useEffect(() => {
    const sessionPublicId = gameSession?.publicId;
    if (!sessionPublicId || gameSession.status !== 'ACTIVE') return;
    const socketPublicId: string = sessionPublicId;
    const pendingAnswers = pendingSocketAnswersRef.current;
    let disposed = false;
    let retryCount = 0;

    function connect() {
      if (disposed) return;
      queueMicrotask(() => {
        if (!disposed) setSocketState('connecting');
      });
      const socket = new WebSocket(privacySocketUrl(socketPublicId));
      socketRef.current = socket;
      socket.addEventListener('open', () => {
        retryCount = 0;
        setSocketState('connected');
      });
      socket.addEventListener('message', (event) => {
        const realtime = JSON.parse(String(event.data)) as PrivacyRealtimeEvent;
        if (realtime.type === 'privacy.session') {
          setGameSession(realtime.data);
          setScenarioIndex(Math.min(realtime.data.answeredCount, realtime.data.questionCount - 1));
          if (realtime.data.tutorialRequired) setTutorialStep(0);
          return;
        }
        if (realtime.type === 'privacy.answer.result') {
          const pending = pendingAnswers.get(realtime.requestId);
          if (!pending) return;
          window.clearTimeout(pending.timer);
          pendingAnswers.delete(realtime.requestId);
          pending.resolve(realtime.data);
          return;
        }
        if (realtime.type === 'privacy.answer.error') {
          const pending = pendingAnswers.get(realtime.requestId);
          if (!pending) return;
          window.clearTimeout(pending.timer);
          pendingAnswers.delete(realtime.requestId);
          pending.reject();
        }
      });
      socket.addEventListener('close', (event) => {
        if (socketRef.current === socket) socketRef.current = null;
        if (disposed || event.code === 1000) return;
        setSocketState('offline');
        retryCount += 1;
        reconnectTimerRef.current = window.setTimeout(connect, Math.min(10_000, 1000 * 2 ** Math.min(retryCount, 3)));
      });
      socket.addEventListener('error', () => socket.close());
    }

    connect();
    return () => {
      disposed = true;
      if (reconnectTimerRef.current !== null) window.clearTimeout(reconnectTimerRef.current);
      for (const pending of pendingAnswers.values()) {
        window.clearTimeout(pending.timer);
        pending.reject();
      }
      pendingAnswers.clear();
      socketRef.current?.close(1000, 'Page closed');
      socketRef.current = null;
    };
  }, [gameSession?.publicId, gameSession?.status]);

  function answerViaSocket(requestId: string, questionId: string, choice: PrivacyChoice): Promise<PrivacyAnswerResult> {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return Promise.reject(new Error('WebSocket offline'));
    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => {
        pendingSocketAnswersRef.current.delete(requestId);
        reject(new Error('WebSocket timeout'));
      }, 8000);
      pendingSocketAnswersRef.current.set(requestId, { resolve, reject: () => reject(new Error('WebSocket error')), timer });
      socket.send(JSON.stringify({ type: 'answer', requestId, questionId, choice }));
    });
  }

  function advanceTutorial() {
    if (tutorialStep === null) return;
    if (tutorialStep < tutorialSlides.length - 1) {
      setTutorialStep(tutorialStep + 1);
      return;
    }
    setTutorialStep(null);
    if (gameSession?.tutorialRequired) {
      setGameSession((current) => current ? { ...current, tutorialRequired: false } : current);
      void completePrivacyTutorial(gameSession.id).catch(() => undefined);
    }
  }

  async function choose(choice: PrivacyChoice) {
    if (!gameSession || !question || submitting || answerResult) return;
    setSubmitting(true);
    setLastChoice(choice);
    setToast(null);
    const savingToastTimer = window.setTimeout(() => {
      setToast({ type: 'saving', message: choice === 'SHARE' ? 'Menyimpan pilihan Bagikan…' : 'Menyimpan pilihan Tolak…' });
    }, 600);
    try {
      const requestId = `${question.id}:${choice}`;
      const idempotencyKey = `privacy-ws:${requestId}`;
      const result = socketState === 'connected'
        ? await answerViaSocket(requestId, question.id, choice).catch(() => answerPrivacyQuestion(gameSession.id, question.id, choice, idempotencyKey))
        : await answerPrivacyQuestion(gameSession.id, question.id, choice, idempotencyKey);
      setAnswerResult(result);
      setToast(null);
      setGameSession((current) => current ? {
        ...current,
        status: result.session.status,
        answeredCount: result.session.answeredCount,
        score: result.session.score,
        mistakes: result.session.mistakes,
      } : current);
    } catch {
      setToast({ type: 'error', message: 'Jawaban belum tersimpan. Periksa koneksi lalu coba lagi.' });
    } finally {
      window.clearTimeout(savingToastTimer);
      setSubmitting(false);
    }
  }

  function next() {
    if (!answerResult || !gameSession) return;
    if (answerResult.session.status === 'ACTIVE') {
      setScenarioIndex(answerResult.session.answeredCount);
    }
    setAnswerResult(null);
    setInfoOpen(false);
  }

  function exitGame() {
    intentionalExitRef.current = true;
    const exit = onExit ?? (() => navigate('/'));
    if (gameSession?.status === 'ACTIVE') {
      void abandonPrivacySession(gameSession.id).catch(() => undefined);
    }
    exit();
  }

  if (loading) return <GameLoadingWindow message={publicId ? 'Memuat sesi permainan…' : 'Membuat sesi permainan…'} title="PRIVASI.EXE" />;
  if (!gameSession || !question) return <GameLoadingWindow error={error || 'Sesi Privasi tidak tersedia.'} onBack={() => navigate('/')} onRetry={() => void loadSession()} title="PRIVASI.EXE" />;
  if (lost && !answerResult) {
    return <main className="game-stage centered"><GameResult detail={`Tiga jawaban keliru. Skor sesi: ${gameSession.score}/${gameSession.questionCount}.`} onExit={onExit ?? (() => navigate('/'))} onRetry={() => navigate('/game/privacy', { replace: true })} title="Nyawa habis" /></main>;
  }
  if (finished && !answerResult) {
    return <main className="game-stage centered"><GameResult detail={`${gameSession.score} dari ${gameSession.questionCount} keputusan aman.`} onExit={onExit ?? (() => navigate('/'))} onRetry={() => navigate('/game/privacy', { replace: true })} title="Privasi selesai" /></main>;
  }

  return (
    <main className={`privacy-game-screen ${tutorial ? `privacy-tutorial-focus-${tutorial.focus}` : ''}`} tabIndex={-1}>
      <header className="privacy-hud">
        <div className="privacy-hud-left"><Lives compact current={Math.max(0, 3 - gameSession.mistakes)} /><span aria-label={`Koneksi realtime ${socketState}`} className="session-status-dot" data-state={socketState} /></div>
        <div className="privacy-progress"><span>{scenarioIndex + 1}/{gameSession.questionCount} Pertanyaan</span><button aria-label="Buka tutorial" onClick={() => setTutorialStep(0)} type="button"><img alt="" aria-hidden="true" src="/assets/Shared/Game/ButtonInfo.png" /></button><button aria-label="Keluar dari permainan" onClick={() => setExitConfirmOpen(true)} type="button"><img alt="" aria-hidden="true" src="/assets/Shared/Game/ButtonClose.png" /></button></div>
      </header>

      <section className="privacy-character-zone" aria-labelledby="character-name">
        <motion.img alt={`Karakter ${question.characterName}`} animate={{ opacity: 1, y: 0 }} className="privacy-character" initial={reduceMotion ? false : { opacity: 0, y: 18 }} key={question.id} src={question.characterAsset} />
        <aside className={`privacy-info-panel ${infoOpen ? 'privacy-info-active' : ''}`} aria-label="Info karakter"><div className="privacy-info-title"><img alt="" aria-hidden="true" src="/assets/Shared/Game/ButtonInfo.png" /> Info</div><div className="privacy-info-content"><strong id="character-name">Nama: {question.characterName}</strong><span>Umur Akun: {question.accountAge}</span><span>Hubungan:</span><p>{question.relationship}</p></div></aside>
      </section>

      <article className="privacy-dialogue">
        <div className="privacy-dialogue-bar"><span>Percakapan</span><span>{scenarioIndex + 1}/{gameSession.questionCount}</span></div>
        <p>{question.prompt}</p>
        <div className="privacy-choices"><button aria-label="Bagikan" className="privacy-share" disabled={submitting || Boolean(answerResult)} onClick={() => void choose('SHARE')} type="button"><img alt="" aria-hidden="true" src="/assets/Shared/Game/share.png" /><span>{submitting && lastChoice === 'SHARE' ? 'Menyimpan…' : 'Bagikan'}</span></button><button aria-label="Tolak" className="privacy-reject" disabled={submitting || Boolean(answerResult)} onClick={() => void choose('REJECT')} type="button"><img alt="" aria-hidden="true" src="/assets/Shared/Game/block.png" /><span>{submitting && lastChoice === 'REJECT' ? 'Menyimpan…' : 'Tolak'}</span></button></div>
      </article>

      {toast && <section aria-live="polite" className={`privacy-toast ${toast.type === 'error' ? 'is-error' : 'is-saving'}`}><div className="privacy-toast-bar"><span>{toast.type === 'error' ? 'Koneksi bermasalah' : 'JEJAK'}</span>{toast.type === 'error' && <button aria-label="Tutup notifikasi" onClick={() => setToast(null)} type="button">×</button>}</div><div className="privacy-toast-content"><img alt="" aria-hidden="true" src={toast.type === 'error' ? '/assets/Shared/Mascots/Mascot_Shocked.png' : '/assets/Shared/Mascots/Mascot_Busy.png'} /><div><p>{toast.message}</p>{toast.type === 'saving' ? <span className="privacy-saving-dots" aria-hidden="true">•••</span> : <button disabled={!lastChoice || submitting} onClick={() => { if (lastChoice) void choose(lastChoice); }} type="button">Coba lagi</button>}</div></div></section>}
      {infoOpen && <button aria-label="Tutup info" className="privacy-info-dismiss" onClick={() => setInfoOpen(false)} type="button" />}
      {answerResult && <div className="privacy-answer-backdrop"><section aria-live="polite" className={`privacy-answer-popup ${answerResult.correct ? 'is-correct' : 'is-wrong'}`}><img alt="Maskot JEJAK" src={answerResult.correct ? '/assets/Shared/Mascots/Mascot_Happy.png' : '/assets/Shared/Mascots/Mascot_Cry.png'} /><div><p>{answerResult.correct ? 'PILIHAN AMAN' : 'HATI-HATI'}</p><h2>{answerResult.correct ? 'Benar!' : 'Belum tepat!'}</h2><p>{answerResult.feedback}</p><p>{answerResult.explanation}</p><button onClick={next} type="button">Lanjut</button></div></section></div>}
      {tutorial && <button aria-label="Lanjutkan tutorial" className={`privacy-tutorial-backdrop tutorial-layout-${tutorial.focus}`} onClick={advanceTutorial} type="button"><section aria-labelledby="privacy-tutorial-title" className="privacy-tutorial"><img alt="Maskot JEJAK" src={tutorial.mascot} /><div className="privacy-tutorial-box"><p>PANDUAN {(tutorialStep ?? 0) + 1}/6</p><h2 id="privacy-tutorial-title">{tutorial.content}</h2><span>Klik di mana saja untuk lanjut</span></div></section></button>}
      {exitConfirmOpen && <div className="privacy-exit-backdrop"><section aria-labelledby="exit-title" aria-modal="true" className="privacy-exit-dialog" role="dialog"><img alt="Maskot JEJAK" src="/assets/Shared/Mascots/Mascot_Shocked.png" /><div><h2 id="exit-title">Keluar dari permainan?</h2><p>Progres sesi ini akan dihapus dan tidak disimpan.</p><div><button onClick={() => void exitGame()} type="button">Ya, keluar</button><button onClick={() => setExitConfirmOpen(false)} type="button">Lanjut bermain</button></div></div></section></div>}
    </main>
  );
}
