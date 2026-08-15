import { useEffect, useRef } from 'react';

interface GameResultProps {
  title: string;
  detail: string;
  onRetry: () => void;
  onExit?: (() => void) | undefined;
}

export function GameResult({ title, detail, onRetry, onExit }: GameResultProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => headingRef.current?.focus(), []);

  return (
    <section className="pixel-window result-panel" aria-live="polite">
      <img alt="" aria-hidden="true" src="/assets/Shared/Mascots/Mascot_Wink.png" />
      <p className="eyebrow">HASIL</p>
      <h1 ref={headingRef} tabIndex={-1}>{title}</h1>
      <p>{detail}</p>
      <div className="button-row">
        <button className="pixel-button primary" onClick={onRetry} type="button">Main lagi</button>
        {onExit && <button className="pixel-button" onClick={onExit} type="button">Kembali ke desktop</button>}
      </div>
    </section>
  );
}
