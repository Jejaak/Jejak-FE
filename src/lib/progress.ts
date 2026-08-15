import { apiUrl } from './api.ts';

export type ProgressMode = 'PRIVACY' | 'PHISHING' | 'DOWNLOADS';

export interface CompletedRun {
  mode: ProgressMode;
  score: number;
  maxScore: number;
  mistakes: number;
  durationMs: number;
}

interface GameProgressSummary {
  gameType: ProgressMode;
  status: 'NOT_STARTED' | 'COMPLETED';
  bestScore: number | null;
  lastPlayedAt: string | null;
}

export interface ProgressSummary {
  completedGames: number;
  totalGames: number;
  games: GameProgressSummary[];
}

export async function postCompletedRun(run: CompletedRun, authenticated: boolean): Promise<boolean> {
  if (!authenticated) return false;

  try {
    const response = await fetch(apiUrl('/api/v1/progress'), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': `${run.mode.toLowerCase()}:${crypto.randomUUID()}`,
      },
      body: JSON.stringify({ ...run, durationMs: Math.max(1, run.durationMs) }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function getProgressSummary(authenticated: boolean): Promise<ProgressSummary | null> {
  if (!authenticated) return null;

  try {
    const response = await fetch(apiUrl('/api/v1/progress'), { credentials: 'include' });
    if (!response.ok) return null;
    const payload = await response.json() as { data: ProgressSummary };
    return payload.data;
  } catch {
    return null;
  }
}
