/**
 * Fire-and-forget revalidation of Next.js ISR pages.
 * Calls the web container's /api/revalidate endpoint.
 * Never throws — failures are logged and silently ignored.
 */

const WEB_INTERNAL_URL = process.env.WEB_INTERNAL_URL || 'http://os-web:3000';
const REVALIDATION_SECRET = process.env.REVALIDATION_SECRET || '';

export function revalidatePaths(paths: string[]): void {
  fetch(`${WEB_INTERNAL_URL}/api/revalidate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: REVALIDATION_SECRET, paths }),
  }).catch((err: Error) => {
    console.warn('[revalidate] Failed to reach web container:', err.message);
  });
}

// Pre-built helpers for common events
export const revalidateForProblem = () => revalidatePaths(['/', '/problems']);
export const revalidateForSolution = () => revalidatePaths(['/', '/problems', '/leaderboard', '/bots']);
export const revalidateForVote = () => revalidatePaths(['/', '/leaderboard', '/bots']);
export const revalidateForFlag = () => revalidatePaths(['/', '/problems']);
