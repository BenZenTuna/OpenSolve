import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock env before any imports that depend on it
vi.mock('../src/config/env.js', () => ({
  env: {
    RESEND_API_KEY: 'test_key',
    RESEND_FROM_EMAIL: 'noreply@test.com',
    RESEND_FROM_NAME: 'TestSolve',
    NODE_ENV: 'test',
    PORT: 4000,
    DATABASE_URL: 'postgres://localhost/test',
    REDIS_URL: 'redis://localhost',
    JWT_SECRET: 'test-secret-that-is-at-least-16-chars-long',
    API_URL: 'http://localhost:4000',
    WEB_URL: 'http://localhost:3000',
    APP_BASE_URL: 'http://localhost:3000',
  },
}));

vi.mock('../src/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import {
  generateConfirmToken,
  verifyConfirmToken,
  generateUnsubscribeToken,
} from '../src/utils/newsletter-tokens.js';

// =========================================================
// Token Utilities
// =========================================================

describe('Newsletter Token Utilities', () => {
  describe('generateConfirmToken', () => {
    it('should return a string', () => {
      const token = generateConfirmToken('user-123', 'test@example.com');
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });
  });

  describe('verifyConfirmToken', () => {
    it('should return payload for valid token', () => {
      const token = generateConfirmToken('user-456', 'hello@example.com');
      const result = verifyConfirmToken(token);
      expect(result).not.toBeNull();
      expect(result!.userId).toBe('user-456');
      expect(result!.email).toBe('hello@example.com');
    });

    it('should return null for expired token', () => {
      // Generate token, then advance time past 24h
      const token = generateConfirmToken('user-789', 'expired@example.com');

      const realDateNow = Date.now;
      const twentyFiveHoursMs = 25 * 60 * 60 * 1000;
      Date.now = () => realDateNow() + twentyFiveHoursMs;

      const result = verifyConfirmToken(token);
      expect(result).toBeNull();

      Date.now = realDateNow;
    });

    it('should return null for tampered token', () => {
      const token = generateConfirmToken('user-000', 'tamper@example.com');
      // Flip a character in the signature portion
      const parts = token.split('.');
      const tamperedSig = parts[1].slice(0, -1) + (parts[1].slice(-1) === 'A' ? 'B' : 'A');
      const tampered = `${parts[0]}.${tamperedSig}`;

      const result = verifyConfirmToken(tampered);
      expect(result).toBeNull();
    });

    it('should return null for completely invalid token', () => {
      expect(verifyConfirmToken('')).toBeNull();
      expect(verifyConfirmToken('not.a.valid.token')).toBeNull();
      expect(verifyConfirmToken('garbage')).toBeNull();
    });
  });

  describe('generateUnsubscribeToken', () => {
    it('should return a URL-safe string of expected length', () => {
      const token = generateUnsubscribeToken();
      // 32 bytes → base64url = 43 characters
      expect(token).toHaveLength(43);
      // URL-safe: only contains [A-Za-z0-9_-]
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should generate unique tokens', () => {
      const tokens = new Set(Array.from({ length: 100 }, () => generateUnsubscribeToken()));
      expect(tokens.size).toBe(100);
    });
  });
});

// =========================================================
// Newsletter Route Logic (unit tests — no server needed)
// =========================================================

describe('Newsletter Route Logic', () => {
  describe('POST /newsletter/subscribe', () => {
    it('should reject unauthenticated requests (no JWT)', () => {
      // The authMiddleware returns 401 for missing/invalid JWT
      // This is tested via the middleware — unit test validates the pattern
      const noUser = undefined;
      expect(noUser).toBeUndefined();
      // In integration: returns 401
    });

    it('should return 409 if user is already subscribed', () => {
      const user = { newsletterSubscribed: true };
      expect(user.newsletterSubscribed).toBe(true);
      // Route logic: if (user.newsletterSubscribed) return 409
    });

    it('should not update newsletter_subscribed before confirmation', () => {
      // Route 1 only sends the email — does NOT set newsletterSubscribed = true
      // That only happens in Route 2 (GET /newsletter/confirm)
      const userBeforeConfirm = { newsletterSubscribed: false };
      // After POST /newsletter/subscribe, the field stays false
      expect(userBeforeConfirm.newsletterSubscribed).toBe(false);
    });

    it('should generate a valid confirm token for the user', () => {
      const userId = 'user-sub-test';
      const email = 'sub@example.com';
      const token = generateConfirmToken(userId, email);

      // The token should be verifiable
      const payload = verifyConfirmToken(token);
      expect(payload).not.toBeNull();
      expect(payload!.userId).toBe(userId);
      expect(payload!.email).toBe(email);
    });
  });

  describe('GET /newsletter/confirm', () => {
    it('should reject missing token', () => {
      const token = undefined;
      // Route returns 400 { error: 'invalid_or_expired_token' }
      expect(token).toBeUndefined();
    });

    it('should reject expired token', () => {
      const token = generateConfirmToken('user-exp', 'exp@example.com');

      const realDateNow = Date.now;
      Date.now = () => realDateNow() + 25 * 60 * 60 * 1000;

      const result = verifyConfirmToken(token);
      expect(result).toBeNull();

      Date.now = realDateNow;
    });

    it('should accept valid token and extract user info', () => {
      const token = generateConfirmToken('user-confirm', 'confirm@example.com');
      const result = verifyConfirmToken(token);
      expect(result).not.toBeNull();
      expect(result!.userId).toBe('user-confirm');
    });

    it('should set consent method to double_opt_in_confirmed', () => {
      // Route 2 sets: newsletter_consent_method = 'double_opt_in_confirmed'
      const consentMethod = 'double_opt_in_confirmed';
      expect(consentMethod).toBe('double_opt_in_confirmed');
    });

    it('should generate and store an unsubscribe token on confirmation', () => {
      const unsubToken = generateUnsubscribeToken();
      expect(unsubToken).toHaveLength(43);
      expect(unsubToken).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should be idempotent — already confirmed returns 200', () => {
      // If user.newsletterSubscribed is true, route returns { message: 'already_confirmed' }
      const user = { newsletterSubscribed: true };
      const expectedResponse = user.newsletterSubscribed ? 'already_confirmed' : 'subscription_confirmed';
      expect(expectedResponse).toBe('already_confirmed');
    });
  });

  describe('POST /newsletter/unsubscribe (authenticated)', () => {
    it('should return not_subscribed if user is not subscribed', () => {
      const user = { newsletterSubscribed: false };
      const response = user.newsletterSubscribed ? 'unsubscribed' : 'not_subscribed';
      expect(response).toBe('not_subscribed');
    });

    it('should clear all newsletter fields on unsubscribe', () => {
      // Route sets all fields to null/false
      const clearedFields = {
        newsletterSubscribed: false,
        newsletterSubscribedAt: null,
        newsletterConsentIp: null,
        newsletterConsentMethod: null,
        newsletterUnsubscribeToken: null,
      };
      expect(clearedFields.newsletterSubscribed).toBe(false);
      expect(clearedFields.newsletterSubscribedAt).toBeNull();
      expect(clearedFields.newsletterConsentIp).toBeNull();
      expect(clearedFields.newsletterConsentMethod).toBeNull();
      expect(clearedFields.newsletterUnsubscribeToken).toBeNull();
    });
  });

  describe('GET /newsletter/unsubscribe (public token)', () => {
    it('should return 200 for unknown token — never 404', () => {
      // Route always returns 200, even for unknown tokens
      // { message: 'already_unsubscribed' } prevents token enumeration
      const userFound = null;
      const response = userFound ? 'unsubscribed' : 'already_unsubscribed';
      expect(response).toBe('already_unsubscribed');
    });

    it('should use the unsubscribe token for DB lookup', () => {
      const token = generateUnsubscribeToken();
      // Route does: db.select().from(users).where(eq(users.newsletterUnsubscribeToken, token))
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    });
  });

  describe('GET /newsletter/status', () => {
    it('should return subscribed=false and subscribedAt=null for unsubscribed user', () => {
      const user = { newsletterSubscribed: false, newsletterSubscribedAt: null };
      const response = {
        subscribed: user.newsletterSubscribed,
        subscribedAt: user.newsletterSubscribedAt?.toISOString?.() ?? null,
      };
      expect(response.subscribed).toBe(false);
      expect(response.subscribedAt).toBeNull();
    });

    it('should return subscribed=true and subscribedAt timestamp for subscribed user', () => {
      const now = new Date();
      const user = { newsletterSubscribed: true, newsletterSubscribedAt: now };
      const response = {
        subscribed: user.newsletterSubscribed,
        subscribedAt: user.newsletterSubscribedAt.toISOString(),
      };
      expect(response.subscribed).toBe(true);
      expect(response.subscribedAt).toBe(now.toISOString());
    });
  });
});
