import { useEffect, useRef, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface TutorialProps {
  title: string;
  children: ReactNode;
  onStart: () => void;
}

export function Tutorial({ title, children, onStart }: TutorialProps) {
  const reduceMotion = useReducedMotion();
  const backdropRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const backdrop = backdropRef.current;
    const parent = backdrop?.parentElement;
    const siblings = parent ? Array.from(parent.children).filter((element) => element !== backdrop) : [];
    for (const sibling of siblings) {
      sibling.setAttribute('inert', '');
      sibling.setAttribute('aria-hidden', 'true');
    }
    startRef.current?.focus();

    return () => {
      for (const sibling of siblings) {
        sibling.removeAttribute('inert');
        sibling.removeAttribute('aria-hidden');
      }
      previousFocusRef.current?.focus();
    };
  }, []);

  return (
    <div className="tutorial-backdrop" ref={backdropRef}>
      <motion.section
        animate={{ opacity: 1, scale: 1 }}
        aria-labelledby="tutorial-title"
        aria-modal="true"
        className="pixel-window tutorial-panel"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
        role="dialog"
        transition={{ duration: 0.2 }}
      >
        <img alt="" aria-hidden="true" className="tutorial-mascot" src="/assets/Shared/Mascots/Mascot_Happy.png" />
        <div>
          <p className="eyebrow">PANDUAN</p>
          <h2 id="tutorial-title">{title}</h2>
          <div className="tutorial-copy">{children}</div>
          <button className="pixel-button primary" onClick={onStart} ref={startRef} type="button">Mulai bermain</button>
        </div>
      </motion.section>
    </div>
  );
}
