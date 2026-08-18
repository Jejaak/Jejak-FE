import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate, useParams } from 'react-router';
import { GameLoadingWindow } from '../components/game-loading-window.tsx';
import { GameResult } from '../components/game-result.tsx';
import { Lives } from '../components/lives.tsx';
import { abandonPhishingSession, getPhishingSession, phishingSocketUrl, postPhishingAnswer, startPhishingSession, type PhishingAnswerResult, type PhishingQuestion, type PhishingRealtimeEvent, type PhishingRegionId, type PhishingSession } from '../lib/phishing.ts';

const phishingAbandonTimers = new Map<string, number>();
const maxScore = 15;
const phishingTutorialExample: PhishingQuestion = {
  id: 'tutorial-phishing',
  senderName: 'Anne Roblox',
  senderEmail: 'support@roblox-free.xyz',
  senderAsset: '/assets/Game1/characters/chara10.png',
  subject: '10.000 Robux gratis untukmu',
  preview: 'Klaim hadiah gratis sebelum kesempatan berakhir.',
  greeting: 'Halo!',
  body: 'Selamat, kamu terpilih mendapatkan 10.000 Robux gratis dari event spesial hari ini. Untuk menerima hadiah, segera lakukan verifikasi akun sebelum kesempatan ini berakhir. Jangan lewatkan hadiahmu! Untuk verifikasi, balas email ini dengan password akun kamu agar hadiah dapat dikirim.',
  action: 'Klaim hadiah di sini: free-robux.xyz',
  attachment: { name: 'hadiah.exe', asset: '/assets/Game3/file.png' },
};
const safeTutorialExample: PhishingQuestion = {
  id: 'tutorial-safe',
  senderName: 'Pak Budi Santoso',
  senderEmail: 'budi.santoso@sekolah.id',
  senderAsset: '/assets/Game1/characters/chara8.png',
  subject: 'Tugas mingguan',
  preview: 'Materi dan instruksi tugas minggu ini.',
  greeting: 'Hai,',
  body: 'Jangan lupa untuk menyelesaikan tugas minggu ini sebelum hari Jumat. Materi dan instruksi tugas sudah dibagikan di kelas sebelumnya. Kalau ada bagian yang belum jelas, kamu bisa menanyakannya saat pelajaran berikutnya.',
  action: 'Tidak ada tautan yang perlu dibuka.',
  attachment: { name: 'tugas.jpg', asset: '/assets/Game3/file.png' },
};

interface StoredPhishingAnswer {
  result: PhishingAnswerResult;
  selectedRegions: PhishingRegionId[];
}

export function PhishingGame({ onExit }: { onExit?: () => void }) {
  const navigate = useNavigate();
  const { publicId } = useParams<{ publicId: string }>();
  const socketRef = useRef<WebSocket | null>(null);
  const intentionalExitRef = useRef(false);
  const latestAnsweredCountRef = useRef(0);
  const pendingAnswersRef = useRef(new Map<string, {
    resolve: (result: PhishingAnswerResult) => void;
    reject: (error: Error) => void;
    timeout: ReturnType<typeof setTimeout>;
  }>());
  const answerKeysRef = useRef<Record<string, string>>({});
  const tutorialButtonRef = useRef<HTMLButtonElement>(null);
  const tutorialTriggerRef = useRef<HTMLButtonElement>(null);
  const tutorialWasOpenRef = useRef(false);
  const messageButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const feedbackButtonRef = useRef<HTMLButtonElement>(null);
  const correctAnswerAudioRef = useRef<HTMLAudioElement | null>(null);
  const wrongAnswerAudioRef = useRef<HTMLAudioElement | null>(null);
  const exitCancelRef = useRef<HTMLButtonElement>(null);
  const inboxTriggerRef = useRef<HTMLButtonElement>(null);
  const exitTriggerRef = useRef<HTMLButtonElement>(null);
  const exitWasOpenRef = useRef(false);
  const senderRef = useRef<HTMLButtonElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLButtonElement>(null);
  const markRef = useRef<HTMLButtonElement>(null);
  const saveRef = useRef<HTMLButtonElement>(null);
  const socketRetryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sessionState, setSessionState] = useState<PhishingSession | null>(null);
  const [socketState, setSocketState] = useState<'connecting' | 'connected' | 'offline'>('connecting');
  const [tutorialStep, setTutorialStep] = useState<number | null>(null);
  const [questions, setQuestions] = useState<PhishingQuestion[]>([]);
  const [loadError, setLoadError] = useState('');
  const [emailIndex, setEmailIndex] = useState(0);
  const [marking, setMarking] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, PhishingRegionId[]>>({});
  const [answers, setAnswers] = useState<Record<string, StoredPhishingAnswer>>({});
  const [feedbackEmailId, setFeedbackEmailId] = useState<string | null>(null);
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
  const [mobileInboxOpen, setMobileInboxOpen] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [finished, setFinished] = useState(false);
  const email = questions[emailIndex];
  const currentAnswer = email ? answers[email.id] : undefined;
  const answered = currentAnswer !== undefined;
  const selectedRegions = email ? currentAnswer?.selectedRegions ?? drafts[email.id] ?? [] : [];
  const feedback = currentAnswer?.result ?? null;
  const popupFeedback = feedbackEmailId === email?.id ? feedback : null;
  const answeredCount = Object.keys(answers).length;
  const score = Object.values(answers).filter(({ result }) => result.correct).length;
  const mistakes = answeredCount - score;
  const lives = Math.max(0, 3 - mistakes);
  const displayEmail = tutorialStep !== null && tutorialStep >= 2
    ? tutorialStep === 6 ? safeTutorialExample : phishingTutorialExample
    : email ?? phishingTutorialExample;

  useEffect(() => {
    if (feedbackEmailId !== null) feedbackButtonRef.current?.focus();
  }, [feedbackEmailId]);

  useEffect(() => {
    if (exitConfirmOpen) {
      exitWasOpenRef.current = true;
      exitCancelRef.current?.focus();
      const close = (event: globalThis.KeyboardEvent) => {
        if (event.key === 'Escape') setExitConfirmOpen(false);
      };
      window.addEventListener('keydown', close);
      return () => window.removeEventListener('keydown', close);
    }
    if (exitWasOpenRef.current) {
      exitWasOpenRef.current = false;
      exitTriggerRef.current?.focus();
    }
  }, [exitConfirmOpen]);

  useEffect(() => {
    if (!mobileInboxOpen) return;
    messageButtonRefs.current[emailIndex]?.focus();
    const close = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileInboxOpen(false);
        inboxTriggerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [emailIndex, mobileInboxOpen]);

  useEffect(() => {
    if (tutorialStep === null) return;
    const target = tutorialStep <= 2
      ? senderRef.current
      : tutorialStep <= 4
        ? paperRef.current
        : tutorialStep === 5
          ? actionRef.current ?? markRef.current
          : saveRef.current ?? paperRef.current;
    target?.scrollIntoView({ block: 'center', inline: 'nearest' });
  }, [tutorialStep]);

  useEffect(() => {
    if (tutorialStep !== null) {
      tutorialWasOpenRef.current = true;
      tutorialButtonRef.current?.focus();
    } else if (tutorialWasOpenRef.current) {
      tutorialWasOpenRef.current = false;
      tutorialTriggerRef.current?.focus();
    }
  }, [tutorialStep]);

  function hydrateSession(loadedSession: PhishingSession) {
    answerKeysRef.current = {};
    const tutorialKey = `jejak:phishing:tutorial:${loadedSession.publicId}`;
    if (loadedSession.status === 'ACTIVE' && localStorage.getItem(tutorialKey) !== 'seen') {
      localStorage.setItem(tutorialKey, 'seen');
      setTutorialStep(0);
    }
    latestAnsweredCountRef.current = loadedSession.answeredCount;
    setFinished(loadedSession.status === 'COMPLETED' || loadedSession.status === 'LOST');
    setSessionState(loadedSession);
    setQuestions(loadedSession.questions);
    const answeredIds = new Set(loadedSession.answers.map((answer) => answer.questionId));
    const firstUnanswered = loadedSession.questions.findIndex((question) => !answeredIds.has(question.id));
    setEmailIndex(firstUnanswered >= 0 ? firstUnanswered : 0);
    setDrafts({});
    setAnswers(Object.fromEntries(loadedSession.answers.map((answer) => [answer.questionId, {
      selectedRegions: answer.selectedClueIds,
      result: {
        type: loadedSession.status === 'LOST'
          ? 'phishing.session.lost'
          : loadedSession.status === 'COMPLETED'
            ? 'phishing.session.completed'
            : 'phishing.answer.saved',
        sessionId: loadedSession.publicId,
        questionId: answer.questionId,
        selectedClueIds: answer.selectedClueIds,
        markedSuspicious: answer.markedSuspicious,
        correct: answer.correct,
        answeredCount: loadedSession.answeredCount,
        score: loadedSession.score,
        mistakes: loadedSession.mistakes,
        status: loadedSession.status,
        suspicious: answer.suspicious,
        explanation: answer.explanation,
        clues: answer.clues,
      },
    }])));
    setLoadError(loadedSession.questions.length === maxScore ? '' : 'Jumlah soal phishing belum lengkap.');
  }

  useEffect(() => {
    let active = true;
    if (!publicId) {
      void startPhishingSession().then((createdSession) => {
        if (active) navigate(`/game/phishing/${createdSession.publicId}`, { replace: true });
      }).catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : 'Tidak dapat membuat sesi phishing.');
      });
      return () => {
        active = false;
      };
    }
    void getPhishingSession(publicId).then((loadedSession) => {
      queueMicrotask(() => {
        if (active) hydrateSession(loadedSession);
      });
    }).catch((error: unknown) => {
      if (active) setLoadError(error instanceof Error ? error.message : 'Tidak dapat memuat sesi phishing.');
    });
    return () => {
      active = false;
    };
  }, [navigate, publicId]);

  useEffect(() => {
    const sessionId = sessionState?.publicId;
    if (!sessionId || sessionState.status !== 'ACTIVE') return;
    const activeSessionId = sessionId;
    const pendingTimer = phishingAbandonTimers.get(activeSessionId);
    if (pendingTimer !== undefined) {
      window.clearTimeout(pendingTimer);
      phishingAbandonTimers.delete(activeSessionId);
    }
    function abandonOnPageHide() {
      if (!intentionalExitRef.current) void abandonPhishingSession(activeSessionId, true).catch(() => undefined);
    }
    window.addEventListener('pagehide', abandonOnPageHide);
    return () => {
      window.removeEventListener('pagehide', abandonOnPageHide);
      if (intentionalExitRef.current) return;
      const timer = window.setTimeout(() => {
        phishingAbandonTimers.delete(activeSessionId);
        void abandonPhishingSession(activeSessionId, true).catch(() => undefined);
      }, 0);
      phishingAbandonTimers.set(activeSessionId, timer);
    };
  }, [sessionState?.publicId, sessionState?.status]);

  const sessionPublicId = sessionState?.publicId;

  useEffect(() => {
    if (!sessionPublicId) return;
    const publicId = sessionPublicId;
    const pendingAnswers = pendingAnswersRef.current;
    let disposed = false;
    let retryCount = 0;
    let socket: WebSocket | null = null;

    function connect() {
      if (disposed) return;
      setSocketState('connecting');
      socket = new WebSocket(phishingSocketUrl(publicId));
      socket.addEventListener('open', () => {
        retryCount = 0;
        socketRef.current = socket;
        setSocketState('connected');
      });
      socket.addEventListener('message', (event) => {
        const message = JSON.parse(String(event.data)) as PhishingRealtimeEvent | {
          type: 'answer_result';
          requestId: string;
          data: PhishingAnswerResult;
        } | {
          type: 'answer_error';
          requestId?: string;
          message: string;
        };
        if (message.type === 'answer_result') {
          const pending = pendingAnswersRef.current.get(message.requestId);
          if (pending) {
            clearTimeout(pending.timeout);
            pendingAnswersRef.current.delete(message.requestId);
            pending.resolve(message.data);
          }
          return;
        }
        if (message.type === 'answer_error') {
          const pending = message.requestId ? pendingAnswersRef.current.get(message.requestId) : undefined;
          if (pending) {
            clearTimeout(pending.timeout);
            pendingAnswersRef.current.delete(message.requestId!);
            pending.reject(new Error(message.message));
          }
          return;
        }
        const realtime = message;
        if (realtime.type === 'phishing.session.abandoned') {
          navigate('/home', { replace: true });
          return;
        }
        if (realtime.type === 'phishing.snapshot') {
          const snapshot = realtime.data;
          if (snapshot.answeredCount < latestAnsweredCountRef.current) return;
          latestAnsweredCountRef.current = snapshot.answeredCount;
          setFinished(snapshot.status === 'COMPLETED' || snapshot.status === 'LOST');
          setSessionState(snapshot);
          setQuestions(snapshot.questions);
          setAnswers(Object.fromEntries(snapshot.answers.map((answer) => [answer.questionId, {
            selectedRegions: answer.selectedClueIds,
            result: {
              type: snapshot.status === 'LOST'
                ? 'phishing.session.lost'
                : snapshot.status === 'COMPLETED'
                  ? 'phishing.session.completed'
                  : 'phishing.answer.saved',
              sessionId: snapshot.publicId,
              questionId: answer.questionId,
              selectedClueIds: answer.selectedClueIds,
              markedSuspicious: answer.markedSuspicious,
              correct: answer.correct,
              answeredCount: snapshot.answeredCount,
              score: snapshot.score,
              mistakes: snapshot.mistakes,
              status: snapshot.status,
              suspicious: answer.suspicious,
              explanation: answer.explanation,
              clues: answer.clues,
            },
          }])));
          return;
        }
        latestAnsweredCountRef.current = Math.max(latestAnsweredCountRef.current, realtime.answeredCount);
        if (realtime.status !== 'ACTIVE' && pendingAnswersRef.current.size === 0) setFinished(true);
        setAnswers((current) => ({
          ...current,
          [realtime.questionId]: {
            selectedRegions: realtime.selectedClueIds,
            result: realtime,
          },
        }));
        setSessionState((current) => current ? {
          ...current,
          status: realtime.status,
          answeredCount: realtime.answeredCount,
          score: realtime.score,
          mistakes: realtime.mistakes,
        } : current);
      });
      socket.addEventListener('close', () => {
        if (socketRef.current === socket) socketRef.current = null;
        if (disposed) return;
        setSocketState('offline');
        retryCount += 1;
        socketRetryRef.current = setTimeout(connect, Math.min(10_000, 1000 * 2 ** Math.min(retryCount, 3)));
      });
      socket.addEventListener('error', () => socket?.close());
    }

    connect();
    return () => {
      disposed = true;
      if (socketRetryRef.current) clearTimeout(socketRetryRef.current);
      if (socketRef.current === socket) socketRef.current = null;
      for (const pending of pendingAnswers.values()) {
        clearTimeout(pending.timeout);
        pending.reject(new Error('Koneksi sesi berubah.'));
      }
      pendingAnswers.clear();
      socket?.close();
    };
  }, [navigate, sessionPublicId]);

  async function exitGame() {
    if (!sessionState || exiting) return;
    intentionalExitRef.current = true;
    setExiting(true);
    setSaveError('');
    try {
      if (sessionState.status === 'ACTIVE') await abandonPhishingSession(sessionState.publicId);
      if (onExit) onExit();
      else navigate('/home', { replace: true });
    } catch (error) {
      intentionalExitRef.current = false;
      setSaveError(error instanceof Error ? error.message : 'Sesi belum dapat ditutup.');
      setExiting(false);
      setExitConfirmOpen(false);
    }
  }

  function advanceTutorial() {
    setTutorialStep((step) => step === null || step >= 6 ? null : step + 1);
  }

  function reset() {
    setFinished(false);
    setFeedbackEmailId(null);
    setSaving(false);
    setSaveError('');
    setLoadError('');
    setQuestions([]);
    setSessionState(null);
    void startPhishingSession(true).then((createdSession) => {
      navigate(`/game/phishing/${createdSession.publicId}`, { replace: true });
    }).catch((error: unknown) => {
      setLoadError(error instanceof Error ? error.message : 'Tidak dapat memulai sesi baru.');
    });
  }

  function toggleRegion(id: PhishingRegionId) {
    if (!email || !marking || answered || saving) return;
    setDrafts((current) => {
      const regions = current[email.id] ?? [];
      return {
        ...current,
        [email.id]: regions.includes(id) ? regions.filter((item) => item !== id) : [...regions, id],
      };
    });
    setSaveError('');
  }

  function submitAnswerRealtime(
    requestId: string,
    questionId: string,
    selectedClueIds: PhishingRegionId[],
    markedSuspicious: boolean,
  ): Promise<PhishingAnswerResult> {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return postPhishingAnswer(sessionState!.publicId, questionId, selectedClueIds, markedSuspicious, requestId);
    }
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        pendingAnswersRef.current.delete(requestId);
        void postPhishingAnswer(sessionState!.publicId, questionId, selectedClueIds, markedSuspicious, requestId).then(resolve, reject);
      }, 3000);
      pendingAnswersRef.current.set(requestId, { resolve, reject, timeout });
      socket.send(JSON.stringify({
        type: 'answer',
        requestId,
        questionId,
        selectedClueIds,
        markedSuspicious,
      }));
    });
  }

  async function saveAnswer() {
    if (!sessionState || !email || answered || saving) return;
    setSaving(true);
    setSaveError('');
    try {
      const answerKey = answerKeysRef.current[email.id] ??= `phishing-answer:${crypto.randomUUID()}`;
      const result = await submitAnswerRealtime(answerKey, email.id, selectedRegions, selectedRegions.length > 0);
      const answerAudioRef = result.correct ? correctAnswerAudioRef : wrongAnswerAudioRef;
      const answerAudio = answerAudioRef.current ?? new Audio(`/assets/Audio/${result.correct ? 'correctanswer' : 'wronganswer'}.mp3`);
      answerAudioRef.current = answerAudio;
      if (!result.correct) answerAudio.volume = 0.7;
      answerAudio.currentTime = 0;
      void answerAudio.play().catch(() => undefined);
      latestAnsweredCountRef.current = Math.max(latestAnsweredCountRef.current, result.answeredCount);
      setAnswers((current) => ({ ...current, [email.id]: { result, selectedRegions } }));
      setSessionState((current) => current ? {
        ...current,
        status: result.status,
        answeredCount: result.answeredCount,
        score: result.score,
        mistakes: result.mistakes,
      } : current);
      setFeedbackEmailId(email.id);
      setMarking(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Jawaban belum dapat disimpan.');
    } finally {
      setSaving(false);
    }
  }

  function selectEmail(index: number) {
    if (saving) return;
    const inboxWasOpen = mobileInboxOpen;
    setFeedbackEmailId(null);
    setMobileInboxOpen(false);
    setEmailIndex(index);
    setMarking(false);
    setSaveError('');
    messageButtonRefs.current[index]?.scrollIntoView({ block: 'nearest', inline: 'center' });
    if (inboxWasOpen) requestAnimationFrame(() => inboxTriggerRef.current?.focus());
  }

  function navigateMessages(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
    const nextIndex = (index + direction + questions.length) % questions.length;
    selectEmail(nextIndex);
    messageButtonRefs.current[nextIndex]?.focus();
  }

  function next() {
    if (!answered) return;
    setFeedbackEmailId(null);
    if (sessionState?.status === 'COMPLETED' || sessionState?.status === 'LOST') {
      setFinished(true);
      return;
    }
    const nextUnanswered = questions.findIndex((item, index) => index > emailIndex && !answers[item.id]);
    const firstUnanswered = questions.findIndex((item) => !answers[item.id]);
    const targetIndex = nextUnanswered >= 0 ? nextUnanswered : Math.max(0, firstUnanswered);
    setEmailIndex(targetIndex);
    setMarking(false);
    setSaveError('');
    requestAnimationFrame(() => messageButtonRefs.current[targetIndex]?.focus());
  }

  function regionClass(id: PhishingRegionId, className = '') {
    return `email-region ${selectedRegions.includes(id) ? 'is-marked' : ''} ${className}`.trim();
  }

  const tutorialContent = [
    <>Email yang terlihat aman, <strong className="tutorial-pink">bisa aja berbahaya!</strong></>,
    <>Pertama, periksa <strong className="tutorial-cyan">siapa</strong> yang mengirim emailnya..</>,
    <>Alamat <strong className="tutorial-pink">pengirim yang aneh</strong> bisa jadi tanda bahaya..</>,
    <>Terus, cari <strong className="tutorial-cyan">hal mencurigakan dalam pesannya!</strong></>,
    <>Contoh <strong className="tutorial-pink">hal-hal yang mencurigakan</strong> seperti ini..</>,
    <><strong className="tutorial-cyan">Tandai</strong> (1) hal mencurigakan dalam pesan</>,
    <>Kalau tidak ada tanda bahaya, <strong className="tutorial-pink">simpan</strong> pesan-nya</>,
  ];
  const tutorial = tutorialStep === null ? null : tutorialContent[tutorialStep];

  if (loadError || !email) {
    return <GameLoadingWindow error={loadError || undefined} message="Membuka kotak masuk permainan…" onBack={() => navigate('/home')} onRetry={loadError ? () => window.location.reload() : undefined} title="PHISHING.EXE" />;
  }

  if (finished) {
    const lost = sessionState?.status === 'LOST';
    return <main className="game-stage centered"><GameResult detail={lost ? `Tiga jawaban salah. Kamu menyelesaikan ${answeredCount} pesan dengan ${score} jawaban benar.` : `${score} dari ${maxScore} email dinilai dengan tepat.`} onExit={onExit ?? (() => navigate('/home'))} onRetry={reset} title={lost ? 'HP habis' : 'Kotak masuk aman'} /></main>;
  }

  return (
    <main className={`phishing-screen ${marking ? 'phishing-marking-mode' : ''} ${tutorialStep === null ? '' : `phishing-tutorial-step-${tutorialStep + 1}`}`} tabIndex={-1}>
      <div aria-hidden={popupFeedback !== null || tutorial !== null || exitConfirmOpen} className="phishing-game-surface" inert={popupFeedback !== null || tutorial !== null || exitConfirmOpen}>
      <header className="phishing-hud">
        <Lives compact current={lives} />
        <div className="phishing-progress">
          {sessionState && <span aria-label={`Koneksi realtime ${socketState}`} className="session-status-dot" data-state={socketState} />}
          <span>{answeredCount}/{maxScore} Pesan</span>
          <button aria-label="Buka tutorial" onClick={() => { setMobileInboxOpen(false); setTutorialStep(0); }} ref={tutorialTriggerRef} type="button"><img alt="" aria-hidden="true" src="/assets/Shared/Game/ButtonInfo.png" /></button>
          <button aria-label="Keluar dari permainan" onClick={() => { setMobileInboxOpen(false); setExitConfirmOpen(true); }} ref={exitTriggerRef} type="button"><img alt="" aria-hidden="true" src="/assets/Shared/Game/ButtonClose.png" /></button>
        </div>
      </header>

      <section className={`phishing-mail-window ${mobileInboxOpen ? 'mobile-inbox-open' : ''}`} aria-label="Aplikasi email">
        <button aria-label="Tutup daftar pesan" className="phishing-inbox-scrim" onClick={() => setMobileInboxOpen(false)} type="button" />
        <aside aria-label="Kotak masuk pesan" className={`phishing-inbox ${mobileInboxOpen ? 'is-open' : ''}`}>
          <div className="phishing-inbox-title"><span aria-hidden="true">›</span><h1>Inbox Pesan</h1><span>{questions.length}</span><button aria-label="Tutup daftar pesan" onClick={() => { setMobileInboxOpen(false); inboxTriggerRef.current?.focus(); }} type="button">×</button></div>
          <div className="phishing-message-list" id="phishing-inbox-list">
            {questions.map((item, index) => {
              const itemAnswered = answers[item.id] !== undefined;
              return (
                <button
                  aria-current={index === emailIndex ? 'page' : undefined}
                  aria-label={`${item.senderName}, ${item.subject}, ${itemAnswered ? 'sudah dijawab' : 'belum dijawab'}`}
                  className="phishing-message-item"
                  data-answered={itemAnswered}
                  key={item.id}
                  onClick={() => selectEmail(index)}
                  onKeyDown={(event) => navigateMessages(event, index)}
                  ref={(element) => { messageButtonRefs.current[index] = element; }}
                  tabIndex={index === emailIndex ? 0 : -1}
                  type="button"
                >
                  <img alt="" aria-hidden="true" src={item.senderAsset} />
                  <span className="phishing-message-copy"><strong>{item.senderName}</strong><span>{item.subject}</span><small>{item.preview}</small></span>
                  <span className="phishing-message-status">{itemAnswered ? 'Sudah dijawab' : 'Belum dijawab'}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <article aria-hidden={mobileInboxOpen} aria-labelledby="email-subject" className="phishing-reader" inert={mobileInboxOpen}>
          <div className="phishing-reader-bar"><button aria-controls="phishing-inbox-list" aria-expanded={mobileInboxOpen} aria-label="Buka daftar pesan" className="phishing-inbox-trigger" onClick={() => setMobileInboxOpen(true)} ref={inboxTriggerRef} type="button"><span aria-hidden="true">☰</span> Pesan</button><span>Pesan {emailIndex + 1}</span><span>{answered ? 'Sudah dijawab' : selectedRegions.length > 0 ? `${selectedRegions.length} ditandai` : 'Belum dijawab'}</span></div>
          <button aria-pressed={selectedRegions.includes('sender')} className={regionClass('sender', 'phishing-sender')} disabled={!marking || answered} onClick={() => toggleRegion('sender')} ref={senderRef} type="button">
            <img alt={`Karakter ${displayEmail.senderName}`} src={displayEmail.senderAsset} />
            <span><strong>{displayEmail.senderName}</strong><small>{displayEmail.senderEmail}</small></span>
          </button>
          <div className="phishing-email-paper" ref={paperRef}>
            <button aria-pressed={selectedRegions.includes('subject')} className={regionClass('subject', 'phishing-subject')} disabled={!marking || answered} id="email-subject" onClick={() => toggleRegion('subject')} type="button"><strong>Subjek:</strong> {displayEmail.subject}</button>
            <button aria-pressed={selectedRegions.includes('body')} className={regionClass('body', 'phishing-copy')} disabled={!marking || answered} onClick={() => toggleRegion('body')} type="button"><span>{displayEmail.greeting}</span><span>{displayEmail.body}</span></button>
            <button aria-pressed={selectedRegions.includes('action')} className={regionClass('action', 'phishing-action')} disabled={!marking || answered} onClick={() => toggleRegion('action')} ref={actionRef} type="button"><span className="phishing-action-content">{displayEmail.action}{tutorialStep === 5 && <img alt="Ikon pencarian" className="phishing-tutorial-search" src="/assets/Game3/search.png" />}</span></button>
            {displayEmail.attachment && <button aria-pressed={selectedRegions.includes('attachment')} className={regionClass('attachment', 'phishing-attachment')} disabled={!marking || answered} onClick={() => toggleRegion('attachment')} type="button"><img alt="" aria-hidden="true" src={displayEmail.attachment.asset} /><span>{displayEmail.attachment.name}</span></button>}
          </div>

          {!answered && (
            <div className="phishing-action-footer">
              <div className="phishing-actions">
                <button aria-pressed={marking} className="phishing-asset-button mark-email-button" disabled={saving} onClick={() => setMarking((current) => !current)} ref={markRef} type="button"><img alt="" aria-hidden="true" src="/assets/Shared/Game/email.png" /><span>Pilih Tanda</span></button>
                <button className={`phishing-asset-button ${selectedRegions.length > 0 ? 'mark-email-button' : 'save-email-button'}`} disabled={saving} onClick={() => void saveAnswer()} ref={saveRef} type="button"><img alt="" aria-hidden="true" src={selectedRegions.length > 0 ? '/assets/Shared/Game/email.png' : '/assets/Shared/Game/save.png'} /><span>{saving ? 'Menyimpan...' : selectedRegions.length > 0 ? 'Tandai Email' : 'Simpan'}</span></button>
              </div>
              {marking && <p className="phishing-helper" role="status">Klik bagian email yang mencurigakan. Jika email aman, jangan tandai apa pun lalu Simpan.</p>}
            </div>
          )}
          {saveError && <p className="phishing-save-error" role="alert">{saveError}</p>}
        </article>
      </section>
      </div>

      {exitConfirmOpen && (
        <div className="phishing-exit-backdrop">
          <section aria-labelledby="phishing-exit-title" aria-modal="true" className="phishing-exit-dialog" role="dialog">
            <img alt="Maskot JEJAK terkejut" src="/assets/Shared/Mascots/Mascot_Shocked.png" />
            <div>
              <h2 id="phishing-exit-title">Keluar dari permainan?</h2>
              <p>Progres sesi ini akan ditandai belum selesai dan tidak dapat dilanjutkan kembali.</p>
              <div>
                <button disabled={exiting} onClick={() => void exitGame()} type="button">{exiting ? 'Menutup sesi...' : 'Ya, keluar'}</button>
                <button disabled={exiting} onClick={() => setExitConfirmOpen(false)} ref={exitCancelRef} type="button">Lanjut bermain</button>
              </div>
            </div>
          </section>
        </div>
      )}

      {popupFeedback && (
        <div className="phishing-feedback-backdrop">
          <section aria-labelledby="phishing-feedback-title" aria-live="polite" aria-modal="true" className={`phishing-feedback-popup ${popupFeedback.correct ? 'is-correct' : 'is-wrong'}`} role="dialog">
            <img alt="Maskot JEJAK" src={popupFeedback.correct ? '/assets/Shared/Mascots/Mascot_Happy.png' : '/assets/Shared/Mascots/Mascot_Cry.png'} />
            <div>
              <p>{popupFeedback.correct ? 'PILIHAN AMAN' : 'HATI-HATI'}</p>
              <h2 id="phishing-feedback-title">{popupFeedback.correct ? 'Benar!' : 'Belum tepat!'}</h2>
              <p>{popupFeedback.explanation}</p>
              {popupFeedback.clues.length > 0 && <ul>{popupFeedback.clues.map((clue) => <li key={clue.id}><strong>{clue.label}:</strong> {clue.text}</li>)}</ul>}
              <button onClick={next} ref={feedbackButtonRef} type="button">{sessionState?.status !== 'ACTIVE' ? 'Lihat hasil' : 'Pesan berikutnya'}</button>
            </div>
          </section>
        </div>
      )}

      {tutorial && (
        <button aria-label={`Lanjutkan tutorial, langkah ${(tutorialStep ?? 0) + 1} dari 7`} className={`phishing-tutorial-backdrop phishing-tutorial-layout-${(tutorialStep ?? 0) + 1}`} onClick={advanceTutorial} ref={tutorialButtonRef} type="button">
          <section aria-live="polite" className="phishing-tutorial-card">
            <img alt="Maskot JEJAK" src={(tutorialStep ?? 0) === 6 ? '/assets/Shared/Mascots/Mascot_Wink.png' : (tutorialStep ?? 0) >= 3 ? '/assets/Shared/Mascots/Mascot_Busy.png' : '/assets/Shared/Mascots/Mascot_Shocked.png'} />
            <div className="phishing-tutorial-window"><span aria-hidden="true" className="phishing-tutorial-window-bar">□ □ ×</span><h2>{tutorial}</h2></div>
          </section>
          <span className="phishing-tutorial-next">Klik di mana saja untuk lanjut</span>
        </button>
      )}
    </main>
  );
}
