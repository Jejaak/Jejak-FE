import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion, useReducedMotion } from 'motion/react';
import type { GameId } from '../data/content.ts';
import { authClient } from '../lib/auth-client.ts';
import { getProgressSummary, type ProgressSummary } from '../lib/progress.ts';

const games: Array<{ id: GameId; name: string; description: string; asset: string; route: string }> = [
  { id: 'privacy', name: 'Privasi', description: 'Tentukan informasi yang aman untuk dibagikan.', asset: '/assets/Home/IconPrivasi.png', route: '/game/privacy' },
  { id: 'phishing', name: 'Phishing', description: 'Periksa email dan temukan tanda penipuan.', asset: '/assets/Home/IconPhishing.png', route: '/game/phishing' },
  { id: 'downloads', name: 'Unduhan', description: 'Hentikan file mencurigakan sebelum mencapai PC.', asset: '/assets/Home/IconVirus.png', route: '/game/downloads' },
];

export function HomePage() {
  const session = authClient.useSession();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [selected, setSelected] = useState<GameId>('privacy');
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const game = games.find((item) => item.id === selected) ?? games[0]!;
  const mode = selected.toUpperCase() as 'PRIVACY' | 'PHISHING' | 'DOWNLOADS';
  const gameProgress = summary?.games.find((item) => item.gameType === mode);

  useEffect(() => {
    let active = true;
    void getProgressSummary(Boolean(session.data)).then((value) => {
      if (active) setSummary(value);
    });
    return () => { active = false; };
  }, [session.data]);

  async function logout() {
    await authClient.signOut();
    navigate('/', { replace: true });
  }

  return (
    <main className="home-screen" tabIndex={-1}>
      <nav className="site-nav" aria-label="Navigasi utama">
        <Link className="wordmark" to="/">JEJAK</Link>
        <div className="nav-actions"><span className="player-name">{session.data?.user.name}</span><button className="nav-button" onClick={() => void logout()} type="button">Logout</button></div>
      </nav>
      <section className="home-content">
        <motion.div animate={{ opacity: 1, y: 0 }} className="welcome-panel" initial={reduceMotion ? false : { opacity: 0, y: 18 }}>
          <div className="welcome-copy">
            <p className="eyebrow">LITERASI KEAMANAN DIGITAL</p>
            <h1>Selamat datang di <span>JEJAK</span></h1>
            <p>Pilih permainan dan latih keputusan aman di dunia digital.</p>
            {summary && <p className="progress-summary" role="status">{summary.completedGames} dari {summary.totalGames} permainan selesai</p>}
          </div>
          <img alt="Maskot JEJAK menyambut pemain" src="/assets/Shared/Mascots/Mascot_Wink.png" />
        </motion.div>
        <section className="game-picker" aria-labelledby="choose-game">
          <div className="picker-title"><h2 id="choose-game">Pilih game</h2><span>3 program tersedia</span></div>
          <div className="game-icons">
            {games.map((item) => (
              <button aria-pressed={selected === item.id} className="game-icon-button" key={item.id} onClick={() => setSelected(item.id)} type="button">
                <img alt="" aria-hidden="true" src={item.asset} /><span>{item.name}</span>
              </button>
            ))}
          </div>
          <article className="selected-game pixel-window">
            <div className="window-bar"><span>{game.name.toUpperCase()}.EXE</span><span>— □ ×</span></div>
            <img alt="" aria-hidden="true" src={game.asset} />
            <div>
              <h3>{game.name}</h3>
              <p>{game.description}</p>
              {gameProgress?.status === 'COMPLETED' ? <p>Skor terbaik: {gameProgress.bestScore}</p> : <p>Belum dimainkan</p>}
            </div>
            <Link className="pixel-button primary" to={game.route}>{gameProgress?.status === 'COMPLETED' ? 'Main lagi' : 'Mulai'} {game.name}</Link>
          </article>
        </section>
      </section>
    </main>
  );
}
