import crypto from 'node:crypto';
import { env } from '../config/env.js';

// ===== Double opt-in confirmation token (short-lived, 24h) =====

interface ConfirmPayload {
  userId: string;
  email: string;
  purpose: 'newsletter-confirm';
  iat: number;
  exp: number;
}

const CONFIRM_TTL_SECONDS = 24 * 60 * 60; // 24 hours

function hmacSign(data: string): string {
  return crypto
    .createHmac('sha256', env.JWT_SECRET)
    .update(data)
    .digest('base64url');
}

export function generateConfirmToken(userId: string, email: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: ConfirmPayload = {
    userId,
    email,
    purpose: 'newsletter-confirm',
    iat: now,
    exp: now + CONFIRM_TTL_SECONDS,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = hmacSign(payloadB64);
  return `${payloadB64}.${signature}`;
}

export function verifyConfirmToken(token: string): { userId: string; email: string; issuedAt: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadB64, signature] = parts;
    const expectedSig = hmacSign(payloadB64);

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }

    const payload: ConfirmPayload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString()
    );

    if (payload.purpose !== 'newsletter-confirm') return null;

    const now = Math.floor(Date.now() / 1000);
    if (now > payload.exp) return null;

    return { userId: payload.userId, email: payload.email, issuedAt: payload.iat };
  } catch {
    return null;
  }
}

// ===== Unsubscribe token (long-lived, stored in DB) =====

export function generateUnsubscribeToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}
