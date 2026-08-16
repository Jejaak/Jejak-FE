import { API_BASE_URL, apiUrl } from './api.ts';

export type PhishingRegionId = 'sender' | 'subject' | 'body' | 'action' | 'attachment';

export interface PhishingQuestion {
  id: string;
  senderName: string;
  senderEmail: string;
  senderAsset: string;
  subject: string;
  preview: string;
  greeting: string;
  body: string;
  action: string;
  attachment: { name: string; asset: string } | null;
}

export interface PhishingClue {
  id: PhishingRegionId;
  label: string;
  text: string;
}

export interface PhishingStoredAnswer {
  questionId: string;
  selectedClueIds: PhishingRegionId[];
  markedSuspicious: boolean;
  correct: boolean;
  answeredAt: string;
  suspicious: boolean;
  explanation: string;
  clues: PhishingClue[];
}

export interface PhishingSession {
  id: string;
  publicId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'LOST' | 'ABANDONED';
  startedAt: string;
  completedAt: string | null;
  answeredCount: number;
  score: number;
  mistakes: number;
  questions: PhishingQuestion[];
  answers: PhishingStoredAnswer[];
}

export interface PhishingAnswerResult {
  type: 'phishing.answer.saved' | 'phishing.session.completed' | 'phishing.session.lost';
  sessionId: string;
  questionId: string;
  selectedClueIds: PhishingRegionId[];
  markedSuspicious: boolean;
  correct: boolean;
  answeredCount: number;
  score: number;
  mistakes: number;
  status: 'ACTIVE' | 'COMPLETED' | 'LOST' | 'ABANDONED';
  suspicious: boolean;
  explanation: string;
  clues: PhishingClue[];
}

export type PhishingRealtimeEvent = PhishingAnswerResult
  | { type: 'phishing.snapshot'; data: PhishingSession }
  | { type: 'phishing.session.abandoned'; sessionId: string; status: 'ABANDONED' };

export async function startPhishingSession(restart = false): Promise<PhishingSession> {
  const response = await fetch(apiUrl('/api/v1/phishing-sessions'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ restart }),
  });
  if (!response.ok) throw new Error('Tidak dapat memulai sesi phishing.');
  const payload = await response.json() as { data: PhishingSession };
  return payload.data;
}

export async function getPhishingSession(sessionId: string): Promise<PhishingSession> {
  const response = await fetch(apiUrl(`/api/v1/phishing-sessions/${sessionId}`), {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('Sesi phishing sudah berakhir atau tidak tersedia.');
  const payload = await response.json() as { data: PhishingSession };
  return payload.data;
}

export async function abandonPhishingSession(sessionId: string, keepalive = false): Promise<void> {
  const response = await fetch(apiUrl(`/api/v1/phishing-sessions/${sessionId}/abandon`), {
    method: 'POST',
    credentials: 'include',
    keepalive,
  });
  if (!response.ok && response.status !== 404) throw new Error('Sesi phishing belum dapat ditutup.');
}

export async function postPhishingAnswer(
  sessionId: string,
  questionId: string,
  selectedClueIds: PhishingRegionId[],
  markedSuspicious: boolean,
  idempotencyKey: string,
): Promise<PhishingAnswerResult> {
  const response = await fetch(apiUrl(`/api/v1/phishing-sessions/${sessionId}/answers`), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({ questionId, selectedClueIds, markedSuspicious }),
  });
  if (!response.ok) throw new Error('Jawaban belum dapat disimpan.');
  const payload = await response.json() as { data: PhishingAnswerResult };
  return payload.data;
}

export function phishingSocketUrl(sessionId: string): string {
  const url = new URL(API_BASE_URL);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = `/api/v1/ws/phishing-sessions/${sessionId}`;
  url.search = '';
  url.hash = '';
  return url.toString();
}
