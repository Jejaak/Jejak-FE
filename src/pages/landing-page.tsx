import { useRef, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { DesktopTaskbar, DesktopWindow } from '../components/desktop.tsx';
import { DesktopOnboarding } from '../components/desktop-onboarding.tsx';
import { authClient } from '../lib/auth-client.ts';

type AppId = 'welcome' | 'browser' | 'inbox' | 'profile';
type GameApp = 'privacy' | 'phishing' | 'virus';
type AuthMode = 'login' | 'register';

interface WindowState {
  minimized: boolean;
  maximized: boolean;
  zIndex: number;
}

const desktopGames: Array<{ id: GameApp; name: string; asset: string }> = [
  { id: 'privacy', name: 'Privasi', asset: '/assets/Home/IconPrivasi.png' },
  { id: 'phishing', name: 'Phishing', asset: '/assets/Home/IconPhishing.png' },
  { id: 'virus', name: 'Virus', asset: '/assets/Home/IconVirus.png' },
];

const desktopButton = 'grid w-[6.5rem] min-h-[6.5rem] content-center justify-items-center gap-1 p-1.5 text-center text-[1.05rem] text-white [text-shadow:2px_2px_0_#171426] hover:bg-[rgb(35_29_94_/_45%)] focus-visible:bg-[rgb(35_29_94_/_45%)]';
const desktopTutorialStorageKey = 'jejak.desktopTutorialCompleted';

function desktopTutorialCompleted(): boolean {
  try {
    return window.localStorage.getItem(desktopTutorialStorageKey) === 'true';
  } catch {
    return false;
  }
}

function rememberDesktopTutorial(): void {
  try {
    window.localStorage.setItem(desktopTutorialStorageKey, 'true');
  } catch {
    return;
  }
}

const dialogButton = 'min-h-10 min-w-24 border-2 border-[#171426] bg-[#d8dbcc] px-3 py-2 font-black text-[#171426] shadow-[inset_2px_2px_0_white,inset_-2px_-2px_0_#74776c]';

function AuthBrowser({ mode, authenticated, user, tutorial = false, onMode, onSuccess, onLogout }: { mode: AuthMode; authenticated: boolean; user?: { name: string; email: string } | undefined; tutorial?: boolean; onMode: (mode: AuthMode) => void; onSuccess: () => void; onLogout: () => void }) {
  const initialAddress = authenticated ? 'https://jejak.local/' : `https://jejak.local/${mode}`;
  const [history, setHistory] = useState([initialAddress]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [addressInput, setAddressInput] = useState(initialAddress);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const currentAddress = history[historyIndex] ?? initialAddress;
  const currentUrl = new URL(currentAddress);
  const requestedPage = currentUrl.hostname !== 'jejak.local' ? 'not-found' : currentUrl.pathname === '/register' ? 'register' : currentUrl.pathname === '/login' ? 'login' : currentUrl.pathname === '/search' ? 'search' : currentUrl.pathname === '/' ? 'home' : 'not-found';
  const page = authenticated && (requestedPage === 'login' || requestedPage === 'register') ? 'home' : requestedPage;
  const login = page === 'login';

  function visit(value: string) {
    const raw = value.trim();
    let destination: string;
    if (!raw) destination = 'https://jejak.local/';
    else if (/^https?:\/\//iu.test(raw)) {
      const parsed = new URL(raw);
      destination = parsed.toString();
    } else if (raw.startsWith('/')) destination = `https://jejak.local${raw}`;
    else destination = `https://jejak.local/search?q=${encodeURIComponent(raw)}`;
    if (authenticated && (new URL(destination).hostname !== 'jejak.local' || /\/(login|register)$/u.test(new URL(destination).pathname))) {
      destination = 'https://jejak.local/';
    }
    const nextHistory = [...history.slice(0, historyIndex + 1), destination];
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
    setAddressInput(destination);
    if (destination.endsWith('/login')) onMode('login');
    if (destination.endsWith('/register')) onMode('register');
  }

  function moveHistory(nextIndex: number) {
    const destination = history[nextIndex];
    if (!destination) return;
    setHistoryIndex(nextIndex);
    setAddressInput(destination);
    if (destination.endsWith('/login')) onMode('login');
    if (destination.endsWith('/register')) onMode('register');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !event.currentTarget.checkValidity()) {
      event.currentTarget.reportValidity();
      return;
    }
    setPending(true);
    setError('');
    try {
      const response = login
        ? await authClient.signIn.email({ email: email.trim(), password })
        : await authClient.signUp.email({ name: name.trim(), email: email.trim(), password });
      if (response.error) {
        setError(login ? 'Email atau kata sandi tidak sesuai.' : 'Pendaftaran belum berhasil. Periksa data dan coba lagi.');
        return;
      }
      setHistory(['https://jejak.local/']);
      setHistoryIndex(0);
      setAddressInput('https://jejak.local/');
      onSuccess();
    } catch {
      setError('Backend tidak aktif. Jalankan backend lalu coba lagi.');
    } finally {
      setPending(false);
    }
  }

  const inputClass = 'min-h-11 border-[3px] border-[#171426] bg-white p-2 shadow-[inset_3px_3px_0_#aaa99d]';

  return (
    <div className={`@container overflow-auto bg-[#d9dccd] ${tutorial ? 'h-auto max-h-[calc(100svh-5rem)]' : 'h-[calc(100%-2.65rem)]'}`}>
      <div className="flex gap-5 border-b-2 border-[#74776b] px-2 py-1.5" aria-hidden="true"><span>File</span><span>Edit</span><span>View</span><span>Favorites</span><span>Help</span></div>
      <form className="grid grid-cols-[auto_auto_auto_auto_minmax(0,1fr)_auto] items-center gap-1.5 border-b-2 border-[#74776b] p-1.5 @max-[620px]:grid-cols-[auto_auto_auto_minmax(0,1fr)_auto]" onSubmit={(event) => { event.preventDefault(); visit(addressInput); }}>
        <button aria-label="Kembali" className="grid size-8 place-items-center border-2 border-[#222] bg-[#d9dccd] font-black shadow-[inset_2px_2px_0_white,inset_-2px_-2px_0_#717468]" disabled={historyIndex === 0} onClick={() => moveHistory(historyIndex - 1)} type="button">←</button>
        <button aria-label="Maju" className="grid size-8 place-items-center border-2 border-[#222] bg-[#d9dccd] font-black shadow-[inset_2px_2px_0_white,inset_-2px_-2px_0_#717468]" disabled={historyIndex >= history.length - 1} onClick={() => moveHistory(historyIndex + 1)} type="button">→</button>
        <button aria-label="Beranda" className="grid size-8 place-items-center border-2 border-[#222] bg-[#d9dccd] font-black shadow-[inset_2px_2px_0_white,inset_-2px_-2px_0_#717468]" onClick={() => visit('https://jejak.local/')} type="button">⌂</button>
        <label className="text-sm @max-[620px]:sr-only" htmlFor="browser-address">Address</label>
        <input className="h-8 min-w-0 border-2 border-[#8b8d82] bg-white px-2" id="browser-address" onChange={(event) => setAddressInput(event.target.value)} value={addressInput} />
        <button className="h-8 border-2 border-[#222] bg-[#d9dccd] px-3 font-black shadow-[inset_2px_2px_0_white,inset_-2px_-2px_0_#717468]" type="submit">Go</button>
      </form>

      {page === 'home' && <div className="grid min-h-[30rem] place-items-center bg-[#f1f0e4] p-8 text-center"><div><img alt="Maskot JEJAK" className="mx-auto mb-4 w-40" src={authenticated ? '/assets/Shared/Mascots/Mascot_Shocked.png' : '/assets/Shared/Mascots/Mascot_Happy.png'} /><h1 className="text-4xl">JEJAK Browser</h1>{authenticated ? <><p>Selamat datang kembali, <strong>{user?.name}</strong>.</p><p>{user?.email}</p><button className={`${dialogButton} mt-5`} onClick={onLogout} type="button">Logout</button></> : <><p>Pilih halaman untuk melanjutkan.</p><div className="mt-5 flex justify-center gap-3"><button className={dialogButton} onClick={() => visit('https://jejak.local/login')} type="button">Login</button><button className={dialogButton} onClick={() => visit('https://jejak.local/register')} type="button">Register</button></div></>}</div></div>}

      {page === 'search' && <div className="min-h-[30rem] bg-[#f1f0e4] p-8"><p className="text-sm">SEARCH RESULTS</p><h1 className="text-3xl">Hasil untuk “{currentUrl.searchParams.get('q')}”</h1><p>Pencarian web eksternal dinonaktifkan pada simulasi ini.</p><button className={`${dialogButton} mt-4`} onClick={() => visit('https://jejak.local/')} type="button">Kembali ke JEJAK</button></div>}

      {page === 'not-found' && <div className="grid min-h-[30rem] place-items-center bg-[#f1f0e4] p-8 text-center"><div><p className="text-6xl" aria-hidden="true">⚠</p><h1 className="text-3xl">Site Not Found</h1><p>Browser tidak dapat menemukan <strong>{currentUrl.hostname}</strong>.</p><p>Periksa alamat yang dimasukkan atau kembali ke halaman utama JEJAK.</p><div className="mt-5 flex justify-center gap-3"><button className={dialogButton} disabled={historyIndex === 0} onClick={() => moveHistory(historyIndex - 1)} type="button">Kembali</button><button className={dialogButton} onClick={() => visit('https://jejak.local/')} type="button">Home</button></div></div></div>}

      {(page === 'login' || page === 'register') && <div className={`grid grid-cols-[minmax(12rem,.65fr)_minmax(20rem,1.35fr)] bg-[#f1f0e4] @max-[620px]:grid-cols-1 ${tutorial ? 'min-h-0' : 'min-h-[30rem]'}`}>
        <img alt="Maskot JEJAK" className="w-full self-center p-4 @max-[620px]:hidden" src="/assets/Shared/Mascots/Mascot_Happy.png" />
        <section className="self-center px-[clamp(1rem,4vw,3rem)] py-6 @max-[620px]:px-4 @max-[620px]:py-5">
          <h1 className="mb-1 text-[clamp(1.8rem,4vw,3rem)]">{login ? 'Login Pemain' : 'Buat Akun'}</h1>
          <p>{login ? 'Masuk untuk membuka game dan progresmu.' : 'Daftar untuk menyimpan progres permainan.'}</p>
          <form className="mt-5 grid gap-3" onSubmit={submit}>
            {!login && <label className="grid gap-1 font-black" htmlFor="name">Nama<input className={inputClass} autoComplete="name" id="name" minLength={2} onChange={(event) => setName(event.target.value)} required value={name} /></label>}
            <label className="grid gap-1 font-black" htmlFor="email">Email<input className={inputClass} autoComplete="email" id="email" maxLength={254} onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></label>
            <label className="grid gap-1 font-black" htmlFor="password">Kata sandi<input className={inputClass} autoComplete={login ? 'current-password' : 'new-password'} id="password" maxLength={128} minLength={8} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></label>
            {error && <p className="mb-0 font-black text-[#a00022]" role="alert">{error}</p>}
            <button className={`${dialogButton} justify-self-start bg-[#c7e1e5]`} disabled={pending} type="submit">{pending ? 'Memproses...' : login ? 'Login' : 'Register'}</button>
          </form>
          <p className="mt-5 text-center">{login ? 'Belum punya akun?' : 'Sudah punya akun?'} <button className="border-0 bg-transparent p-0 text-[#23276f] underline" onClick={() => visit(`https://jejak.local/${login ? 'register' : 'login'}`)} type="button">{login ? 'Register' : 'Login'}</button></p>
        </section>
      </div>}
      <div className="border-t-2 border-[#74776b] px-2 py-1 text-xs">Done — {currentAddress}</div>
    </div>
  );
}

export function LandingPage() {
  const desktopRef = useRef<HTMLElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const session = authClient.useSession();
  const user = session.data?.user;
  const authenticated = Boolean(user);
  const initialRouteState = location.state as { authMode?: AuthMode; openBrowser?: boolean } | null;
  const [onboardingStep, setOnboardingStep] = useState<number | null>(() => desktopTutorialCompleted() ? null : 0);
  const zRef = useRef(11);
  const [windows, setWindows] = useState<Partial<Record<AppId, WindowState>>>(() => ({
    ...(desktopTutorialCompleted() ? { welcome: { minimized: false, maximized: false, zIndex: 10 } } : {}),
    ...(initialRouteState?.openBrowser ? { browser: { minimized: false, maximized: false, zIndex: 11 } } : {}),
  }));
  const [authMode, setAuthMode] = useState<AuthMode>(initialRouteState?.authMode ?? 'login');
  const [pendingGame, setPendingGame] = useState<GameApp | null>(null);

  function advanceOnboarding() {
    if (onboardingStep === null) return;
    if (onboardingStep < 11) {
      const nextStep = onboardingStep + 1;
      if (nextStep === 2) {
        setAuthMode('register');
        setWindows((current) => ({ ...current, browser: { minimized: false, maximized: false, zIndex: 320 } }));
      } else if (nextStep === 3) {
        setWindows((current) => {
          const next = { ...current };
          delete next.browser;
          return next;
        });
      }
      setOnboardingStep(nextStep);
      return;
    }
    rememberDesktopTutorial();
    setOnboardingStep(null);
    setWindows((current) => ({ ...current, welcome: { minimized: false, maximized: false, zIndex: 10 } }));
  }

  function activate(id: AppId) {
    zRef.current += 1;
    setWindows((current) => ({ ...current, [id]: { minimized: false, maximized: current[id]?.maximized ?? false, zIndex: zRef.current } }));
  }

  function close(id: AppId) {
    setWindows((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  function minimize(id: AppId) {
    setWindows((current) => current[id] ? { ...current, [id]: { ...current[id], minimized: true } } : current);
  }

  function toggleMaximize(id: Extract<AppId, 'browser'>) {
    setWindows((current) => current[id] ? { ...current, [id]: { ...current[id], maximized: !current[id].maximized } } : current);
  }

  function openGame(id: GameApp) {
    if (!authenticated) {
      setPendingGame(id);
      setAuthMode('login');
      activate('browser');
      return;
    }
    navigate(`/game/${id === 'virus' ? 'downloads' : id}`);
  }

  function authSuccess() {
    if (pendingGame) {
      const destination = pendingGame === 'virus' ? 'downloads' : pendingGame;
      setPendingGame(null);
      navigate(`/game/${destination}`);
    }
  }

  async function logout() {
    await authClient.signOut();
    setPendingGame(null);
    setAuthMode('login');
  }

  const activeZ = Object.values(windows).reduce((highest, windowState) => windowState && !windowState.minimized ? Math.max(highest, windowState.zIndex) : highest, 0);

  function getPinnedState(id: Exclude<AppId, 'welcome'>) {
    const windowState = windows[id];
    return {
      open: Boolean(windowState),
      active: Boolean(windowState && !windowState.minimized && windowState.zIndex === activeZ),
      minimized: windowState?.minimized ?? false,
    };
  }

  const onboardingBrowserOpen = onboardingStep === 2;
  const pinnedState = {
    browser: getPinnedState('browser'),
    inbox: getPinnedState('inbox'),
    profile: getPinnedState('profile'),
  };

  return (
    <main className={`desktop-scanlines relative min-h-dvh overflow-hidden bg-[#756bb6] bg-[url('/assets/Home/Background.png')] bg-cover bg-center text-white [text-shadow:2px_2px_0_#171426] ${onboardingStep === null ? '' : `desktop-onboarding-active desktop-onboarding-step-${onboardingStep + 1}`}`} ref={desktopRef} tabIndex={-1}>
      <nav className="desktop-game-shortcuts absolute top-[clamp(1.5rem,7vh,4rem)] left-[clamp(.7rem,3vw,2.5rem)] z-[2] grid gap-[clamp(.5rem,1.5vh,1rem)] max-sm:relative max-sm:top-auto max-sm:left-auto max-sm:w-48 max-sm:grid-cols-2 max-sm:gap-0.5 max-sm:p-1.5" aria-label="Pilih permainan">
        {desktopGames.map((game) => (
          <button className={`${desktopButton} desktop-game-shortcut desktop-game-shortcut-${game.id}`} key={game.id} onClick={() => openGame(game.id)} type="button">
            <img alt="" aria-hidden="true" className="size-16 object-contain drop-shadow-[3px_3px_0_rgb(17_13_42_/_55%)]" src={game.asset} /><span>{game.name}</span>
          </button>
        ))}
      </nav>

      {windows.welcome && !windows.welcome.minimized && (
        <DesktopWindow className="right-[4%] bottom-[12%] w-[min(68vw,52rem)] max-lg:right-[2%] max-lg:bottom-[14%] max-lg:w-[min(80vw,50rem)] max-sm:right-2 max-sm:bottom-20 max-sm:w-[calc(100vw-1rem)]" constraints={desktopRef} draggable={false} onActivate={() => activate('welcome')} onClose={() => close('welcome')} onMinimize={() => undefined} overflowVisible showMinimize={false} title="Selamat Datang" zIndex={windows.welcome.zIndex}>
          <div className="relative min-h-80 overflow-visible bg-[radial-gradient(circle_at_30%_25%,#252936,#11131b_70%)] text-white">
            <div className="w-[72%] p-[clamp(2rem,5vw,4rem)] [text-shadow:2px_2px_0_#000] max-sm:w-[78%] max-sm:p-5"><h1 className="mb-4 text-[clamp(1.2rem,2.2vw,1.8rem)] font-black leading-tight">{user ? `Selamat datang kembali, ${user.name}!` : 'Hai! Selamat datang di dunia digital.'}</h1><p className="text-[clamp(.95rem,1.5vw,1.2rem)] leading-relaxed">{user ? 'Semua permainan sudah terbuka. Pilih ikon game di desktop dan lanjutkan latihan keamanan digitalmu.' : 'Di sini, tidak semua pesan, file, dan permintaan informasi bisa langsung dipercaya. Siap menguji seberapa jeli kamu menjaga diri tetap aman?'}</p>{!user && <div className="mt-5 flex flex-wrap gap-3"><button className={dialogButton} onClick={() => { setAuthMode('login'); activate('browser'); }} type="button">Login</button><button className={dialogButton} onClick={() => { setAuthMode('register'); activate('browser'); }} type="button">Buat Akun</button></div>}</div>
            <img alt="Maskot JEJAK" className="absolute -right-14 -bottom-20 z-20 w-[min(38%,19rem)] max-sm:-right-8 max-sm:-bottom-14 max-sm:w-[42%]" src={user ? '/assets/Shared/Mascots/Mascot_Shocked.png' : '/assets/Shared/Mascots/Mascot_Busy.png'} />
          </div>
        </DesktopWindow>
      )}

      {windows.browser && (onboardingStep === null || onboardingBrowserOpen) && <DesktopWindow className={onboardingBrowserOpen ? "desktop-onboarding-browser top-1/2 right-[11%] left-[11%] h-auto max-h-[calc(100dvh-4.5rem)] w-auto max-sm:top-1/2 max-sm:right-2 max-sm:left-2 max-sm:h-auto max-sm:max-h-[calc(100svh-3.2rem)] max-sm:w-auto" : "top-[8%] left-[23%] w-[min(72vw,60rem)] max-lg:left-[16%] max-lg:w-[min(80vw,55rem)] max-sm:top-52 max-sm:left-2 max-sm:w-[calc(100vw-1rem)]"} constraints={desktopRef} draggable={!onboardingBrowserOpen} minimized={windows.browser.minimized} onActivate={() => { if (onboardingBrowserOpen) advanceOnboarding(); else activate('browser'); }} onClose={() => close('browser')} maximizable={!onboardingBrowserOpen} maximized={onboardingBrowserOpen ? false : windows.browser.maximized} onMinimize={() => minimize('browser')} onToggleMaximize={() => toggleMaximize('browser')} resizable={!onboardingBrowserOpen} showClose={!onboardingBrowserOpen} showMinimize={!onboardingBrowserOpen} title="Browser" titleIcon="/assets/Desktop/IconBrowser.png" zIndex={windows.browser.zIndex}><AuthBrowser authenticated={authenticated} mode={authMode} onLogout={() => void logout()} onMode={setAuthMode} onSuccess={authSuccess} tutorial={onboardingBrowserOpen} user={user ? { name: user.name, email: user.email } : undefined} /></DesktopWindow>}
      {windows.inbox && <DesktopWindow className="top-[27%] left-[36%] w-[min(90vw,28rem)]" constraints={desktopRef} minimized={windows.inbox.minimized} onActivate={() => activate('inbox')} onClose={() => close('inbox')} onMinimize={() => minimize('inbox')} title="Inbox" titleIcon="/assets/Desktop/IconInbox.png" zIndex={windows.inbox.zIndex}><div className="grid min-h-48 place-items-center p-5 text-center"><div><div className="mb-3 text-5xl" aria-hidden="true">✉</div><h2 className="text-2xl">Coming Soon</h2><p className="mb-0">Fitur pesan akan hadir pada pembaruan berikutnya.</p></div></div></DesktopWindow>}
      {windows.profile && <DesktopWindow className="top-[20%] left-[39%] w-[min(90vw,31rem)] max-sm:top-40 max-sm:left-2 max-sm:w-[calc(100vw-1rem)]" constraints={desktopRef} minimized={windows.profile.minimized} onActivate={() => activate('profile')} onClose={() => close('profile')} onMinimize={() => minimize('profile')} title="Profile" titleIcon="/assets/Desktop/IconProfile.png" zIndex={windows.profile.zIndex}><div className="grid min-h-56 grid-cols-[6rem_minmax(0,1fr)] gap-4 p-5 max-sm:min-h-0 max-sm:grid-cols-[4.5rem_minmax(0,1fr)] max-sm:gap-2 max-sm:p-3"><img alt="Avatar pemain" className="w-24 max-sm:w-[4.5rem]" src="/assets/Shared/Mascots/Mascot_Happy.png" /><div><p className="mb-1 text-sm">PLAYER PROFILE</p><h2 className="mb-3 text-2xl">{user?.name ?? 'Guest Player'}</h2><dl className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 max-sm:gap-x-2 max-sm:text-[.68rem]"><dt>Status</dt><dd>{authenticated ? 'Online' : 'Belum login'}</dd><dt>Email</dt><dd className="truncate">{user?.email ?? '—'}</dd></dl>{authenticated ? <button className={`${dialogButton} mt-4 max-sm:w-full max-sm:text-[.68rem]`} onClick={() => void logout()} type="button">Logout</button> : <button className={`${dialogButton} mt-4 whitespace-normal max-sm:w-full max-sm:px-1 max-sm:text-[.6rem]`} onClick={() => activate('browser')} type="button">Buka Browser untuk Login</button>}</div></div></DesktopWindow>}
      {onboardingStep !== null && <DesktopOnboarding onNext={advanceOnboarding} playerName={user?.name ?? 'Pemain'} step={onboardingStep} />}
      <DesktopTaskbar items={[]} onBrowser={() => activate('browser')} onInbox={() => activate('inbox')} onProfile={() => activate('profile')} onSelect={() => undefined} pinnedState={pinnedState} />
    </main>
  );
}
