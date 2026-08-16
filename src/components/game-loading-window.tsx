interface GameLoadingWindowProps {
  title: string;
  message?: string | undefined;
  error?: string | null | undefined;
  onRetry?: (() => void) | undefined;
  onBack?: (() => void) | undefined;
}

export function GameLoadingWindow({ title, message = 'Menghubungkan ke server permainan…', error, onRetry, onBack }: GameLoadingWindowProps) {
  return (
    <main className="game-loading-screen" aria-live="polite" tabIndex={-1}>
      <section className="game-loading-window" role={error ? 'alert' : 'status'}>
        <div className="game-loading-title"><span aria-hidden="true">▤</span><strong>{title}</strong><span aria-hidden="true">— □ ×</span></div>
        <div className="game-loading-content">
          <img alt="" aria-hidden="true" src={error ? '/assets/Shared/Mascots/Mascot_Shocked.png' : '/assets/Shared/Mascots/Mascot_Busy.png'} />
          <div>
            <h1>{error ? 'Koneksi bermasalah' : 'Membuka permainan'}</h1>
            <p>{error ?? message}</p>
            {!error && <div className="game-loading-track" aria-label="Sedang memuat"><span /></div>}
            {error && <div className="game-loading-actions">{onRetry && <button onClick={onRetry} type="button">Coba lagi</button>}{onBack && <button onClick={onBack} type="button">Kembali</button>}</div>}
          </div>
        </div>
        <div className="game-loading-status">{error ? 'Offline' : 'Loading…'}</div>
      </section>
    </main>
  );
}
