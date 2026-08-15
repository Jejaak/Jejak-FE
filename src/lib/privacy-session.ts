import { apiUrl, websocketUrl } from './api.ts';

export type PrivacyChoice = 'SHARE' | 'REJECT';
export type PrivacySessionStatus = 'ACTIVE' | 'COMPLETED' | 'LOST' | 'ABANDONED';

export interface PrivacySessionQuestion {
  id: string;
  position: number;
  characterName: string;
  characterAsset: string;
  accountAge: string;
  relationship: string;
  prompt: string;
}

export interface PrivacySession {
  id: string;
  publicId: string;
  status: PrivacySessionStatus;
  questionCount: number;
  answeredCount: number;
  score: number;
  mistakes: number;
  tutorialRequired: boolean;
  questions: PrivacySessionQuestion[];
}

export interface PrivacyAnswerResult {
  correct: boolean;
  explanation: string;
  feedback: string;
  session: Pick<PrivacySession, 'id' | 'publicId' | 'status' | 'answeredCount' | 'score' | 'mistakes'>;
}

export type PrivacyRealtimeEvent =
  | { type: 'privacy.session'; data: PrivacySession }
  | { type: 'privacy.answer.result'; requestId: string; data: PrivacyAnswerResult }
  | { type: 'privacy.answer.error'; requestId: string; message: string }
  | { type: 'privacy.error'; message: string };

export function privacySocketUrl(publicId: string): string {
  return websocketUrl(`/api/v1/ws/privacy-sessions/${publicId}`);
}

async function apiRequest<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...init,
    credentials: 'include',
    signal: init.signal ?? AbortSignal.timeout(10_000),
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
  if (!response.ok) throw new Error(`Privacy API request failed with status ${response.status}`);
  const payload = await response.json() as { data: T };
  return payload.data;
}

export function getPrivacySession(publicId: string): Promise<PrivacySession> {
  return apiRequest(`/api/v1/privacy-sessions/public/${publicId}`, { method: 'GET' });
}

export function startPrivacySession(): Promise<PrivacySession> {
  return apiRequest('/api/v1/privacy-sessions', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export function completePrivacyTutorial(sessionId: string): Promise<{ id: string; tutorialRequired: false }> {
  return apiRequest(`/api/v1/privacy-sessions/${sessionId}/tutorial-completed`, {
    method: 'POST',
    body: JSON.stringify({}),
    keepalive: true,
  });
}

export function answerPrivacyQuestion(sessionId: string, questionId: string, choice: PrivacyChoice, idempotencyKey = `privacy:${sessionId}:${questionId}:${choice}`): Promise<PrivacyAnswerResult> {
  return apiRequest(`/api/v1/privacy-sessions/${sessionId}/answers`, {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ questionId, choice }),
  });
}

export function abandonPrivacySession(sessionId: string): Promise<{ id: string; status: PrivacySessionStatus }> {
  return apiRequest(`/api/v1/privacy-sessions/${sessionId}/abandon`, {
    method: 'POST',
    body: JSON.stringify({}),
    keepalive: true,
  });
}
