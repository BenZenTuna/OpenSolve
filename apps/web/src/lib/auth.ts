import { apiFetch, apiUrl } from './api';

interface User {
  id: string;
  username: string | null;
  email: string;
  role: string;
  botName: string | null;
  botId: string | null;
  hasApiKey: boolean;
  onboardingComplete: boolean;
  createdAt: string;
}

/**
 * Get the currently authenticated user from the JWT cookie.
 * Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const user = await apiFetch<User>('/auth/me', {
      credentials: 'include',
      cache: 'no-store',
    });
    return user;
  } catch {
    return null;
  }
}

/**
 * Logout the current user by clearing the JWT cookie.
 */
export async function logout(): Promise<void> {
  await fetch(apiUrl('/auth/logout'), {
    method: 'POST',
    credentials: 'include',
  });
}

/**
 * Get the Google OAuth URL.
 */
export function getGoogleAuthUrl(): string {
  return apiUrl('/auth/google');
}

