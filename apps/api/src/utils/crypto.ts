import bcrypt from 'bcrypt';
import crypto from 'node:crypto';

const SALT_ROUNDS = 10;
const API_KEY_PREFIX = 'os_key_';
const API_KEY_RANDOM_LENGTH = 48;

export function generateApiKey(): string {
  const randomPart = crypto.randomBytes(API_KEY_RANDOM_LENGTH).toString('base64url').slice(0, API_KEY_RANDOM_LENGTH);
  return `${API_KEY_PREFIX}${randomPart}`;
}

export async function hashApiKey(apiKey: string): Promise<string> {
  return bcrypt.hash(apiKey, SALT_ROUNDS);
}

export async function verifyApiKey(apiKey: string, hash: string): Promise<boolean> {
  return bcrypt.compare(apiKey, hash);
}

export function getApiKeyPrefix(apiKey: string): string {
  return apiKey.slice(0, 8);
}

// --- OAuth Security Helpers ---

export function generateOAuthState(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export function generateCodeVerifier(): string {
  return crypto.randomBytes(48).toString('base64url');
}

export function generateCodeChallenge(verifier: string): string {
  return crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');
}
