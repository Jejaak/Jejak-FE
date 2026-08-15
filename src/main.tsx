import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './app.tsx';
import { AppErrorBoundary } from './components/app-error-boundary.tsx';
import './app.css';

const root = document.getElementById('root');
if (!root) throw new Error('Elemen aplikasi tidak ditemukan');

createRoot(root).render(
  <StrictMode>
    <AppErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppErrorBoundary>
  </StrictMode>,
);
