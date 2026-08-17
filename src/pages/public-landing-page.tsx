import { useState } from 'react';
import { useNavigate } from 'react-router';

type LandingTab = 'home' | 'games' | 'learn';

const games = [
  { id: 'privacy', title: 'PRIVASI', icon: '/assets/Home/IconPrivasi.png', text: 'Belajar menjaga informasi pribadi dan memahami kapan, kepada siapa, serta dalam situasi apa informasi aman untuk dibagikan.' },
  { id: 'phishing', title: 'PHISHING', icon: '/assets/Home/IconPhishing.png', text: 'Belajar mengenali tanda-tanda pesan, tautan, dan permintaan mencurigakan agar tidak mudah tertipu di internet.' },
  { id: 'virus', title: 'VIRUS', icon: '/assets/Home/IconVirus.png', text: 'Belajar berhati-hati terhadap file dan unduhan mencurigakan yang dapat membahayakan perangkat.' },
] as const;

const learningSteps = [
  { number: '01', title: 'LIHAT', icon: '/assets/Landing/IconEye.png', text: 'Perhatikan situasinya. Cari tahu siapa yang berbicara, apa yang diminta, dan apa yang terlihat mencurigakan.' },
  { number: '02', title: 'PIKIR', icon: '/assets/Landing/IconBrain.png', text: 'Jangan langsung percaya. Pertimbangkan apakah informasi, pesan, atau file tersebut benar-benar aman.' },
  { number: '03', title: 'PILIH', icon: '/assets/Landing/IconCheck.png', text: 'Ambil keputusan. Gunakan petunjuk yang kamu temukan untuk menentukan tindakan yang paling aman.' },
  { number: '04', title: 'PELAJARI', icon: '/assets/Landing/IconBook.png', text: 'Cari tahu alasannya. JEJAK akan menjelaskan kenapa pilihanmu aman atau berisiko.' },
] as const;

export function PublicLandingPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<LandingTab>('home');

  return (
    <main className="public-landing" tabIndex={-1}>
      <img alt="JEJAK" className="public-landing-logo" src="/assets/Logo.png" />

      <aside className="public-mission" aria-labelledby="mission-title">
        <img alt="" aria-hidden="true" src="/assets/Landing/CointainerMisi.png" />
        <div>
          <h1 className="sr-only" id="mission-title">MISI KAMU</h1>
          <section>
            <img alt="Maskot Jeja" src="/assets/Shared/Mascots/Mascot_Neutral.png" />
            <div><h2>Ada yang janggal di<br />dunia digital.</h2><p>Tidak semua yang muncul di layar bisa dipercaya. Cari petunjuk dan pilih tindakan yang paling aman.</p></div>
            <div className="public-mission-status"><span>Status: Siap</span><strong>03 Misi</strong></div>
          </section>
        </div>
      </aside>

      <button className="public-play" onClick={() => navigate('/home')} type="button"><img alt="Mainkan JEJAK" src="/assets/Landing/ButtonPlay.png" /></button>

      <section className="public-browser" aria-labelledby="browser-title">
        <img alt="" aria-hidden="true" className="public-browser-frame" src="/assets/Landing/ContainerBrowser.png" />
        <div className="public-browser-inner">
          <h2 className="sr-only" id="browser-title">Informasi JEJAK</h2>
          <nav aria-label="Informasi JEJAK">
            <button aria-current={tab === 'home' ? 'page' : undefined} onClick={() => setTab('home')} type="button">Beranda</button>
            <button aria-current={tab === 'games' ? 'page' : undefined} onClick={() => setTab('games')} type="button">Permainan</button>
            <button aria-current={tab === 'learn' ? 'page' : undefined} onClick={() => setTab('learn')} type="button">Cara Belajar</button>
          </nav>
          <div className="public-browser-page">
            {tab === 'home' && (
              <div className="public-home-tab">
                <img alt="JEJAK membantu anak mengenali risiko digital" className="public-banner" src="/assets/Landing/Banner.png" />
                <section className="public-intro"><h2>Selamat datang di JEJAK!</h2><p>JEJAK adalah permainan edukasi interaktif yang mengajarkan keamanan digital melalui situasi yang dapat ditemui sehari-hari.</p><div>{games.map((game) => <span key={game.id}>{game.title[0]}{game.title.slice(1).toLowerCase()}</span>)}</div></section>
                <section className="public-problem"><h2>PROBLEM STATEMENT</h2><p>Anak-anak menggunakan internet setiap hari, tetapi belum selalu memahami risiko dari informasi pribadi, pesan mencurigakan, dan file berbahaya.</p><p>Jejak dibuat untuk membantu anak-anak memahami risiko di internet serta belajar berpikir lebih hati-hati sebelum bertindak.</p></section>
                <aside className="public-stat"><strong>32.1%</strong><p>anak di Indonesia pernah membagikan informasi pribadi kepada orang yang tidak mereka kenal secara langsung di internet.</p><small>UNICEF Indonesia, 2023</small></aside>
              </div>
            )}
            {tab === 'games' && (
              <div className="public-games-tab">
                <div>{games.map((game) => <button key={game.id} onClick={() => navigate('/home')} type="button"><img alt="" aria-hidden="true" className="public-game-card-icon" src={game.icon} /><span><strong>{game.title}</strong><small>{game.text}</small></span><i aria-hidden="true">›</i></button>)}</div>
              </div>
            )}
            {tab === 'learn' && (
              <div className="public-learn-tab"><h2>CARA BELAJAR</h2><p>Di JEJAK, kamu belajar lewat keputusan.<br />Hadapi situasi digital, pikirkan risikonya, lalu pelajari alasannya.</p><ol>{learningSteps.map((item, index) => <li key={item.number}><img alt="" aria-hidden="true" src={item.icon} /><strong>{item.number} {item.title}</strong><p>{item.text}</p>{index < learningSteps.length - 1 && <img alt="" aria-hidden="true" className="public-learn-chevron" src="/assets/Landing/chvronRight.png" />}</li>)}</ol></div>
            )}
          </div>

        </div>
      </section>
    </main>
  );
}
