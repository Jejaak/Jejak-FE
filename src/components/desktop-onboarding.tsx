import type { ReactNode } from 'react';

interface DesktopOnboardingProps {
  step: number;
  playerName: string;
  onNext: () => void;
}

interface OnboardingSlide {
  mascot: string;
  content: ReactNode;
}

const cyan = 'desktop-onboarding-cyan';
const pink = 'desktop-onboarding-pink';

export function DesktopOnboarding({ step, playerName, onNext }: DesktopOnboardingProps) {
  const slides: OnboardingSlide[] = [
    {
      mascot: '/assets/Shared/Mascots/Mascot_Neutral.png',
      content: <>Hai! Selamat datang di <strong className={cyan}>JEJAK</strong>, aku bakal nemenin kamu menjelajahi dunia digital ini.</>,
    },
    {
      mascot: '/assets/Shared/Mascots/Mascot_Happy.png',
      content: <>Halo <strong className={pink}>{playerName}</strong>! Perkenalkan nama saya Jeja. Jadi, dalam dunia JEJAK, ada tiga permainan.</>,
    },
    {
      mascot: '/assets/Shared/Mascots/Mascot_Busy.png',
      content: <>Tiga ikon ini adalah tantanganmu. Setiap permainan mengajarkan cara <strong className={pink}>menghadapi situasi berbeda di internet.</strong></>,
    },
    {
      mascot: '/assets/Shared/Mascots/Mascot_Neutral.png',
      content: <>Pertama, <strong className={cyan}>PRIVASI</strong>. Dalam permainan ini, kamu akan belajar bahwa <strong className={cyan}>tidak semua informasi aman untuk dibagikan</strong> ke semua orang.</>,
    },
    {
      mascot: '/assets/Shared/Mascots/Mascot_Cry.png',
      content: <>Nama lengkap, alamat, password, atau informasi pribadi lainnya <strong className={pink}>bisa disalahgunakan</strong> kalau diberikan orang yang salah.</>,
    },
    {
      mascot: '/assets/Shared/Mascots/Mascot_Neutral.png',
      content: <>Kedua, <strong className={cyan}>PHISHING</strong>. Dalam permainan ini, kamu akan belajar bahwa <strong className={cyan}>tidak semua email yang terlihat meyakinkan itu benar.</strong></>,
    },
    {
      mascot: '/assets/Shared/Mascots/Mascot_Shocked.png',
      content: <><strong className={pink}>Penipu sering membuat pesan yang terlihat resmi</strong> untuk membuatmu mengeklik link palsu, memberikan password, dan lain-lain.</>,
    },
    {
      mascot: '/assets/Shared/Mascots/Mascot_Busy.png',
      content: <>Terakhir, <strong className={cyan}>VIRUS</strong>. Dalam permainan ini, kamu akan belajar bahwa <strong className={cyan}>file yang kamu temukan di internet tidak selalu aman.</strong></>,
    },
    {
      mascot: '/assets/Shared/Mascots/Mascot_Cry.png',
      content: <>File dengan nama aneh, atau berasal dari sumber tidak dikenal <strong className={pink}>bisa membawa virus atau malware ke komputermu.</strong></>,
    },
    {
      mascot: '/assets/Shared/Mascots/Mascot_Neutral.png',
      content: <>Sebelum main, kita bikin profilmu dulu. Buka <strong className={pink}>Browser</strong>. Aku tungguin untuk kamu!</>,
    },
  ];
  const slide = slides[step] ?? slides[0]!;

  return (
    <div aria-label={`Tutorial desktop langkah ${step + 1} dari ${slides.length}. Klik di mana saja untuk lanjut.`} aria-modal="true" className={`desktop-onboarding desktop-onboarding-layout-${step + 1}`} onClick={onNext} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onNext(); }} role="dialog" tabIndex={0}>
      <div className="desktop-onboarding-shade" />
      <section className="desktop-onboarding-dialog">
        <img alt="Maskot Jeja" src={slide.mascot} />
        <div className="desktop-onboarding-window">
          <span aria-hidden="true">— □ ×</span>
          <p>{slide.content}</p>
        </div>
      </section>
      <span className="desktop-onboarding-hint">{step === slides.length - 1 ? 'Klik di mana saja untuk mulai' : `${step + 1}/${slides.length} · Klik di mana saja untuk lanjut`}</span>
    </div>
  );
}
