export const DOWNLOAD_DURATION_MS = 6_000;

export function downloadProgress(now: number, startedAt: number, durationMs: number): number {
  return Math.min(100, Math.max(0, Math.round(((now - startedAt) / durationMs) * 100)));
}
