import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject } from 'react';
import { motion, useDragControls, useMotionValue, useReducedMotion } from 'motion/react';

interface DesktopWindowProps {
  title: string;
  titleIcon?: string;
  children: ReactNode;
  className?: string;
  constraints: RefObject<HTMLElement | null>;
  zIndex: number;
  overflowVisible?: boolean;
  draggable?: boolean;
  showMinimize?: boolean;
  showClose?: boolean;
  minimized?: boolean;
  maximized?: boolean;
  maximizable?: boolean;
  resizable?: boolean;
  minWidth?: number;
  minHeight?: number;
  onActivate: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onToggleMaximize?: () => void;
}

export function DesktopWindow({ title, titleIcon = '▤', children, className = '', constraints, zIndex, overflowVisible = false, draggable = true, showMinimize = true, showClose = true, minimized = false, maximized = false, maximizable = false, resizable = false, minWidth = 480, minHeight = 360, onActivate, onClose, onMinimize, onToggleMaximize }: DesktopWindowProps) {
  const controls = useDragControls();
  const reduceMotion = useReducedMotion();
  const windowRef = useRef<HTMLElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const restorePositionRef = useRef({ x: 0, y: 0 });
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (maximized) {
      restorePositionRef.current = { x: x.get(), y: y.get() };
      x.set(0);
      y.set(0);
    } else {
      x.set(restorePositionRef.current.x);
      y.set(restorePositionRef.current.y);
    }
  }, [maximized, x, y]);

  function beginResize(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!resizable || maximized || !windowRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startY = event.clientY;
    const rect = windowRef.current.getBoundingClientRect();
    const maxWidth = Math.max(minWidth, window.innerWidth - rect.left - 8);
    const maxHeight = Math.max(minHeight, window.innerHeight - rect.top - 58);

    function move(pointerEvent: PointerEvent) {
      setSize({
        width: Math.min(maxWidth, Math.max(minWidth, rect.width + pointerEvent.clientX - startX)),
        height: Math.min(maxHeight, Math.max(minHeight, rect.height + pointerEvent.clientY - startY)),
      });
    }
    function stop() {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
    }
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop, { once: true });
  }

  return (
    <motion.section
      animate={{ opacity: 1, scale: 1 }}
      className={`desktop-window absolute touch-none border-[3px] border-[#151719] bg-[#c3c6b5] text-[#171426] shadow-[inset_2px_2px_0_#f5f7e8,inset_-2px_-2px_0_#686b60,9px_9px_0_rgb(20_15_51_/_38%)] [text-shadow:none] ${overflowVisible ? 'overflow-visible' : 'overflow-hidden'} ${maximized ? 'desktop-window-maximized !top-1 !left-1 !h-[calc(100dvh-3.7rem)] !w-[calc(100vw-.5rem)] !translate-x-0 !translate-y-0' : className}`}
      drag={draggable && !maximized}
      dragConstraints={constraints}
      dragControls={controls}
      dragElastic={0}
      dragListener={false}
      dragMomentum={false}
      hidden={minimized}
      initial={reduceMotion ? false : { opacity: 0, scale: .98 }}
      onPointerDown={onActivate}
      ref={windowRef}
      style={{ zIndex, x, y, ...(!maximized && size ? size : {}) }}
    >
      <header
        className={`m-[3px] flex h-9 touch-none select-none items-center justify-between gap-2 bg-gradient-to-r from-[#242768] to-[#747ab4] text-white [text-shadow:1px_1px_0_#000] ${draggable && !maximized ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
        onDoubleClick={() => { if (maximizable) onToggleMaximize?.(); }}
        onPointerDown={(event) => { if (draggable && !maximized) controls.start(event); }}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2 px-2 font-black">{titleIcon.startsWith('/') ? <img alt="" aria-hidden="true" className="size-5 object-contain" src={titleIcon} /> : <span aria-hidden="true">{titleIcon}</span>} {title}</span>
        <span className="flex gap-[3px] pr-[3px]" onPointerDown={(event) => event.stopPropagation()}>
          {showMinimize && <button aria-label={`Minimalkan ${title}`} className="grid size-7 place-items-center border-2 border-[#17191a] bg-[#cdd0bf] text-lg font-black leading-none text-[#171426] shadow-[inset_2px_2px_0_white,inset_-2px_-2px_0_#6e7166]" onClick={onMinimize} type="button"><span className="-translate-y-0.5" aria-hidden="true">—</span></button>}
          {maximizable && <button aria-label={maximized ? `Pulihkan ${title}` : `Maksimalkan ${title}`} className="grid size-7 place-items-center border-2 border-[#17191a] bg-[#cdd0bf] text-base font-black leading-none text-[#171426] shadow-[inset_2px_2px_0_white,inset_-2px_-2px_0_#6e7166]" onClick={onToggleMaximize} type="button"><span aria-hidden="true">{maximized ? '❐' : '□'}</span></button>}
          {showClose && <button aria-label={`Tutup ${title}`} className="grid size-7 place-items-center border-2 border-[#17191a] bg-[#cdd0bf] text-lg font-black leading-none text-[#171426] shadow-[inset_2px_2px_0_white,inset_-2px_-2px_0_#6e7166]" onClick={onClose} type="button"><span aria-hidden="true">×</span></button>}
        </span>
      </header>
      {children}
      {resizable && !maximized && <button aria-label={`Ubah ukuran ${title}`} className="desktop-window-resize absolute right-0 bottom-0 z-50 size-5 cursor-nwse-resize border-0 bg-[linear-gradient(135deg,transparent_0_45%,#666_45%_55%,transparent_55%_65%,#222_65%_75%,transparent_75%)] p-0" onPointerDown={beginResize} type="button" />}
    </motion.section>
  );
}

export interface TaskbarItem {
  id: string;
  label: string;
  icon: string;
  active: boolean;
  minimized: boolean;
}

interface TaskbarWindowState {
  open: boolean;
  active: boolean;
  minimized: boolean;
}

interface DesktopTaskbarProps {
  items: TaskbarItem[];
  onSelect: (id: string) => void;
  onBrowser: () => void;
  onInbox: () => void;
  onProfile: () => void;
  pinnedState: Partial<Record<'browser' | 'inbox' | 'profile', TaskbarWindowState>>;
}

const taskButton = 'inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap border-2 border-[#222] bg-[#d9dccd] px-3 font-black text-[#171426] shadow-[inset_2px_2px_0_white,inset_-2px_-2px_0_#717468] [text-shadow:none] max-sm:h-8 max-sm:gap-1 max-sm:px-2 max-sm:text-[.68rem]';
const runningTaskButton = "relative after:absolute after:inset-x-2 after:bottom-0.5 after:h-1 after:bg-[#242768] after:content-['']";
const activeTaskButton = 'bg-[#aaaead] shadow-[inset_2px_2px_0_#66695f,inset_-2px_-2px_0_white]';

function isTaskbarActive(state: TaskbarWindowState | undefined) {
  return Boolean(state?.open && state.active && !state.minimized);
}

function pinnedTaskButtonClass(state: TaskbarWindowState | undefined) {
  return `${taskButton} ${state?.open ? runningTaskButton : ''} ${isTaskbarActive(state) ? activeTaskButton : ''}`;
}

export function DesktopTaskbar({ items, onSelect, onBrowser, onInbox, onProfile, pinnedState }: DesktopTaskbarProps) {
  return (
    <footer className="desktop-taskbar absolute inset-x-0 bottom-0 z-[200] flex h-[3.2rem] items-center border-t-[3px] border-[#eef0df] bg-[#bfc2b2] px-2 py-1 text-[#171426] shadow-[inset_0_2px_0_white] [text-shadow:none] max-sm:h-[2.45rem] max-sm:px-1 max-sm:py-0.5">
      <nav className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto max-sm:gap-0.5" aria-label="Aplikasi desktop">
        <button aria-pressed={isTaskbarActive(pinnedState.browser)} className={`${pinnedTaskButtonClass(pinnedState.browser)} desktop-task-browser`} onClick={onBrowser} type="button"><img alt="" aria-hidden="true" className="size-6 object-contain max-sm:size-4" src="/assets/Desktop/IconBrowser.png" /> Browser</button>
        <button aria-pressed={isTaskbarActive(pinnedState.inbox)} className={pinnedTaskButtonClass(pinnedState.inbox)} onClick={onInbox} type="button"><img alt="" aria-hidden="true" className="size-6 object-contain max-sm:size-4" src="/assets/Desktop/IconInbox.png" /> Inbox</button>
        <button aria-pressed={isTaskbarActive(pinnedState.profile)} className={pinnedTaskButtonClass(pinnedState.profile)} onClick={onProfile} type="button"><img alt="" aria-hidden="true" className="size-6 object-contain max-sm:size-4" src="/assets/Desktop/IconProfile.png" /> Profile</button>
        {items.map((item) => (
          <button
            aria-pressed={item.active && !item.minimized}
            className={`${taskButton} ${runningTaskButton} ${item.active && !item.minimized ? activeTaskButton : ''}`}
            key={item.id}
            onClick={() => onSelect(item.id)}
            type="button"
          >
            {item.icon.startsWith('/') ? <img alt="" aria-hidden="true" className="size-6 object-contain max-sm:size-4" src={item.icon} /> : <span aria-hidden="true">{item.icon}</span>} {item.label}
          </button>
        ))}
      </nav>
    </footer>
  );
}
