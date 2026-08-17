import { Component, type ErrorInfo, type ReactNode } from 'react';

interface AppErrorBoundaryState {
  failed: boolean;
}

export class AppErrorBoundary extends Component<{ children: ReactNode }, AppErrorBoundaryState> {
  public override state: AppErrorBoundaryState = { failed: false };

  public static getDerivedStateFromError(): AppErrorBoundaryState {
    return { failed: true };
  }

  public override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('JEJAK runtime error', error, info.componentStack);
  }

  public override render(): ReactNode {
    if (this.state.failed) {
      return (
        <main className="game-loading-screen" tabIndex={-1}>
          <section className="game-loading-window" role="alert">
            <div className="game-loading-title"><span aria-hidden="true">▤</span><strong>JEJAK</strong><span aria-hidden="true">— □ ×</span></div>
            <div className="game-loading-content">
              <img alt="" aria-hidden="true" src="/assets/Shared/Mascots/Mascot_Shocked.png" />
              <div><h1>Aplikasi bermasalah</h1><p>Halaman tidak dapat ditampilkan pada perangkat ini.</p><div className="game-loading-actions"><button onClick={() => window.location.reload()} type="button">Muat ulang</button><button onClick={() => window.location.assign('/home')} type="button">Kembali</button></div></div>
            </div>
            <div className="game-loading-status">Error</div>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}
