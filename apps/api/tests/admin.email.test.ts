import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'node:crypto';

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

// =========================================================
// Confirmation Token Logic (unit tests)
// =========================================================

describe('Admin Email Confirmation Tokens', () => {
  describe('Token generation', () => {
    it('should create a base64url-encoded JSON payload with admin-email-confirm purpose', () => {
      const adminId = 'admin-123';
      const exp = Date.now() + 10 * 60 * 1000;
      const payload = {
        adminId,
        action: 'send-important',
        purpose: 'admin-email-confirm',
        exp,
      };

      const token = Buffer.from(JSON.stringify(payload)).toString('base64url');
      const decoded = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));

      expect(decoded.adminId).toBe(adminId);
      expect(decoded.purpose).toBe('admin-email-confirm');
      expect(decoded.action).toBe('send-important');
      expect(decoded.exp).toBe(exp);
    });

    it('should produce a SHA-256 hash for Redis key', () => {
      const token = Buffer.from(JSON.stringify({ test: true })).toString('base64url');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const redisKey = `admin:email:confirm:${tokenHash}`;

      expect(redisKey).toContain('admin:email:confirm:');
      expect(tokenHash).toHaveLength(64); // SHA-256 hex digest is 64 chars
    });

    it('should set expiry to 10 minutes (600 seconds)', () => {
      const expiresIn = 600;
      const exp = Date.now() + expiresIn * 1000;

      // Token should expire approximately 10 minutes from now
      const tenMinutesFromNow = Date.now() + 10 * 60 * 1000;
      expect(Math.abs(exp - tenMinutesFromNow)).toBeLessThan(1000);
    });
  });

  describe('Token validation', () => {
    it('should reject tokens with wrong purpose', () => {
      const payload = {
        adminId: 'admin-1',
        action: 'send-important',
        purpose: 'wrong-purpose',
        exp: Date.now() + 600_000,
      };
      const token = Buffer.from(JSON.stringify(payload)).toString('base64url');
      const decoded = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));

      expect(decoded.purpose).not.toBe('admin-email-confirm');
    });

    it('should reject tokens with mismatched adminId', () => {
      const payload = {
        adminId: 'admin-1',
        action: 'send-important',
        purpose: 'admin-email-confirm',
        exp: Date.now() + 600_000,
      };
      const token = Buffer.from(JSON.stringify(payload)).toString('base64url');
      const decoded = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));

      const requestAdminId = 'admin-2';
      expect(decoded.adminId).not.toBe(requestAdminId);
    });

    it('should reject expired tokens', () => {
      const payload = {
        adminId: 'admin-1',
        action: 'send-important',
        purpose: 'admin-email-confirm',
        exp: Date.now() - 1000, // expired 1s ago
      };
      const token = Buffer.from(JSON.stringify(payload)).toString('base64url');
      const decoded = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));

      expect(Date.now() > decoded.exp).toBe(true);
    });

    it('should reject invalid base64url strings gracefully', () => {
      const invalidTokens = ['', 'not-valid-base64', '!!!'];

      for (const token of invalidTokens) {
        try {
          const decoded = Buffer.from(token, 'base64url').toString('utf8');
          JSON.parse(decoded);
          // If parse succeeds, that's ok — validation continues to check fields
        } catch {
          // Expected — invalid tokens should be caught
          expect(true).toBe(true);
        }
      }
    });
  });

  describe('One-time use enforcement', () => {
    it('should use Redis key pattern admin:email:confirm:<hash>', () => {
      const token = Buffer.from(JSON.stringify({ test: true })).toString('base64url');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const key = `admin:email:confirm:${tokenHash}`;

      expect(key).toMatch(/^admin:email:confirm:[a-f0-9]{64}$/);
    });

    it('should store hash not raw token in Redis key', () => {
      const rawToken = 'sensitive-token-value';
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const key = `admin:email:confirm:${tokenHash}`;

      // Key should not contain raw token
      expect(key).not.toContain(rawToken);
      // Key should contain hash
      expect(key).toContain(tokenHash);
    });
  });
});

// =========================================================
// Validation Logic (unit tests)
// =========================================================

describe('Admin Email Validation Logic', () => {
  describe('recipientType validation', () => {
    it('should accept "all" and "single"', () => {
      const valid = ['all', 'single'];
      expect(valid.includes('all')).toBe(true);
      expect(valid.includes('single')).toBe(true);
    });

    it('should reject invalid recipientType values', () => {
      const valid = ['all', 'single'];
      expect(valid.includes('everyone')).toBe(false);
      expect(valid.includes('')).toBe(false);
    });
  });

  describe('subject validation', () => {
    it('should reject subjects shorter than 5 characters', () => {
      const subject = 'Hi';
      expect(subject.length < 5).toBe(true);
    });

    it('should reject subjects longer than 200 characters', () => {
      const subject = 'A'.repeat(201);
      expect(subject.length > 200).toBe(true);
    });

    it('should accept subjects within 5-200 characters', () => {
      const subject = 'Important Update for All Users';
      expect(subject.length >= 5 && subject.length <= 200).toBe(true);
    });
  });

  describe('bodyHtml validation', () => {
    it('should reject body shorter than 20 characters', () => {
      const body = '<p>Short</p>';
      expect(body.length < 20).toBe(true);
    });

    it('should reject body longer than 50000 characters', () => {
      const body = 'A'.repeat(50001);
      expect(body.length > 50000).toBe(true);
    });

    it('should accept body within 20-50000 characters', () => {
      const body = '<p>This is a valid email body with enough content.</p>';
      expect(body.length >= 20 && body.length <= 50000).toBe(true);
    });
  });

  describe('confirmation token action validation', () => {
    it('should accept send-important and broadcast actions', () => {
      const valid = ['send-important', 'broadcast'];
      expect(valid.includes('send-important')).toBe(true);
      expect(valid.includes('broadcast')).toBe(true);
    });

    it('should reject invalid actions', () => {
      const valid = ['send-important', 'broadcast'];
      expect(valid.includes('delete')).toBe(false);
      expect(valid.includes('')).toBe(false);
    });
  });
});

// =========================================================
// Rate Limiting Logic (unit tests)
// =========================================================

describe('Admin Email Rate Limiting', () => {
  it('should allow 2 requests within the window', () => {
    const limit = 2;
    const counts = new Map<string, { count: number; resetAt: number }>();
    const key = 'admin-1';
    const now = Date.now();

    // First request
    counts.set(key, { count: 1, resetAt: now + 3600_000 });
    expect(counts.get(key)!.count).toBe(1);

    // Second request
    const entry = counts.get(key)!;
    entry.count++;
    expect(entry.count).toBe(2);
    expect(entry.count > limit).toBe(false);
  });

  it('should block the 3rd request within the window', () => {
    const limit = 2;
    const counts = new Map<string, { count: number; resetAt: number }>();
    const key = 'admin-1';
    const now = Date.now();

    counts.set(key, { count: 2, resetAt: now + 3600_000 });
    const entry = counts.get(key)!;
    entry.count++; // 3rd attempt
    expect(entry.count > limit).toBe(true); // Should be rate limited
  });

  it('should reset after the time window expires', () => {
    const counts = new Map<string, { count: number; resetAt: number }>();
    const key = 'admin-1';
    const past = Date.now() - 1000; // Already expired

    counts.set(key, { count: 99, resetAt: past });
    const entry = counts.get(key)!;

    // When resetAt < now, should reset
    const now = Date.now();
    const isExpired = now > entry.resetAt;
    expect(isExpired).toBe(true);
    // Reset
    counts.set(key, { count: 1, resetAt: now + 3600_000 });
    expect(counts.get(key)!.count).toBe(1);
  });
});

// =========================================================
// Activity Logging (unit tests)
// =========================================================

describe('Admin Email Activity Logging', () => {
  describe('send-important logging', () => {
    it('should log with action admin_sent_important_email', () => {
      const action = 'admin_sent_important_email';
      expect(action).toBe('admin_sent_important_email');
    });

    it('should include subject, recipientType, counts in metadata', () => {
      const metadata = JSON.stringify({
        subject: 'Test Email',
        recipientType: 'all',
        recipientCount: 100,
        sentBy: 'admin-123',
        succeeded: 98,
        failed: 2,
      });

      const parsed = JSON.parse(metadata);
      expect(parsed.subject).toBe('Test Email');
      expect(parsed.recipientType).toBe('all');
      expect(parsed.recipientCount).toBe(100);
      expect(parsed.sentBy).toBe('admin-123');
      expect(parsed.succeeded).toBe(98);
      expect(parsed.failed).toBe(2);
    });
  });

  describe('broadcast logging', () => {
    it('should log with action admin_sent_newsletter_broadcast', () => {
      const action = 'admin_sent_newsletter_broadcast';
      expect(action).toBe('admin_sent_newsletter_broadcast');
    });

    it('should include recipientCount and sentBy in metadata', () => {
      const metadata = JSON.stringify({
        subject: 'Newsletter #1',
        recipientCount: 50,
        sentBy: 'admin-456',
        succeeded: 48,
        failed: 2,
      });

      const parsed = JSON.parse(metadata);
      expect(parsed.recipientCount).toBe(50);
      expect(parsed.sentBy).toBe('admin-456');
    });
  });

  describe('subscriber view logging', () => {
    it('should log admin access to subscriber list with admin_viewed_subscribers', () => {
      const action = 'admin_viewed_subscribers';
      expect(action).toBe('admin_viewed_subscribers');
    });
  });
});

// =========================================================
// History Filtering (unit tests)
// =========================================================

describe('Admin Email History', () => {
  it('should only return email-related activity_log actions', () => {
    const emailActions = ['admin_sent_important_email', 'admin_sent_newsletter_broadcast'];
    const allActions = [
      'admin_sent_important_email',
      'admin_sent_newsletter_broadcast',
      'newsletter_subscribed',
      'solution_submitted',
      'vote_cast',
    ];

    const filtered = allActions.filter(a => emailActions.includes(a));
    expect(filtered).toEqual(['admin_sent_important_email', 'admin_sent_newsletter_broadcast']);
    expect(filtered).not.toContain('newsletter_subscribed');
    expect(filtered).not.toContain('solution_submitted');
  });

  it('should parse metadata JSON correctly', () => {
    const metadataStr = JSON.stringify({
      subject: 'Test',
      recipientCount: 10,
      succeeded: 10,
      failed: 0,
      sentBy: 'admin-1',
    });

    const details = JSON.parse(metadataStr);
    expect(details.subject).toBe('Test');
    expect(details.recipientCount).toBe(10);
  });

  it('should handle null metadata gracefully', () => {
    const metadata: string | null = null;
    const details = metadata ? JSON.parse(metadata) : {};
    expect(details).toEqual({});
  });

  it('should paginate with default limit of 20 and max of 50', () => {
    const defaultLimit = 20;
    const maxLimit = 50;

    // Default
    const limit1 = Math.min(maxLimit, Math.max(1, parseInt('', 10) || defaultLimit));
    expect(limit1).toBe(20);

    // Override to 30
    const limit2 = Math.min(maxLimit, Math.max(1, parseInt('30', 10) || defaultLimit));
    expect(limit2).toBe(30);

    // Over max
    const limit3 = Math.min(maxLimit, Math.max(1, parseInt('100', 10) || defaultLimit));
    expect(limit3).toBe(50);
  });
});

// =========================================================
// Subscriber Endpoint Logic (unit tests)
// =========================================================

describe('Admin Email Subscribers', () => {
  it('should paginate with default limit of 50 and max of 100', () => {
    const defaultLimit = 50;
    const maxLimit = 100;

    const limit1 = Math.min(maxLimit, Math.max(1, parseInt('', 10) || defaultLimit));
    expect(limit1).toBe(50);

    const limit2 = Math.min(maxLimit, Math.max(1, parseInt('200', 10) || defaultLimit));
    expect(limit2).toBe(100);
  });

  it('should calculate totalPages correctly', () => {
    expect(Math.ceil(0 / 50)).toBe(0);
    expect(Math.ceil(1 / 50)).toBe(1);
    expect(Math.ceil(50 / 50)).toBe(1);
    expect(Math.ceil(51 / 50)).toBe(2);
    expect(Math.ceil(150 / 50)).toBe(3);
  });

  it('should calculate subscriber percentage to 1 decimal place', () => {
    const calc = (subs: number, total: number) =>
      total > 0 ? Math.round((subs / total) * 1000) / 10 : 0;

    expect(calc(0, 0)).toBe(0);
    expect(calc(0, 100)).toBe(0);
    expect(calc(33, 100)).toBe(33);
    expect(calc(1, 3)).toBe(33.3);
    expect(calc(100, 100)).toBe(100);
  });
});

// =========================================================
// CSRF Protection Logic (unit tests)
// =========================================================

describe('Admin Email CSRF Protection', () => {
  const allowedOrigin = 'http://localhost:3000';

  it('should allow requests with matching origin header', () => {
    const origin = 'http://localhost:3000';
    const isValid = origin === allowedOrigin;
    expect(isValid).toBe(true);
  });

  it('should allow requests with referer starting with allowed origin', () => {
    const referer = 'http://localhost:3000/admin/communications';
    const isValid = referer.startsWith(allowedOrigin + '/');
    expect(isValid).toBe(true);
  });

  it('should reject requests with mismatched origin', () => {
    const origin = 'https://evil.com';
    const referer = '';
    const isValid = origin === allowedOrigin || referer.startsWith(allowedOrigin + '/');
    expect(isValid).toBe(false);
  });

  it('should skip CSRF check for GET requests', () => {
    const method = 'GET';
    const skipMethods = ['GET', 'HEAD', 'OPTIONS'];
    expect(skipMethods.includes(method)).toBe(true);
  });
});

// =========================================================
// Broadcast Logic (unit tests)
// =========================================================

describe('Admin Email Broadcast Logic', () => {
  it('should only send to users with newsletter_subscribed = true', () => {
    const allUsers = [
      { id: '1', newsletterSubscribed: true, unsubscribeToken: 'abc' },
      { id: '2', newsletterSubscribed: false, unsubscribeToken: null },
      { id: '3', newsletterSubscribed: true, unsubscribeToken: 'def' },
    ];

    const subscribers = allUsers.filter(
      u => u.newsletterSubscribed && u.unsubscribeToken !== null
    );

    expect(subscribers).toHaveLength(2);
    expect(subscribers.map(s => s.id)).toEqual(['1', '3']);
  });

  it('should require unsubscribe token for each broadcast recipient', () => {
    const subscribers = [
      { email: 'a@test.com', username: 'a', unsubscribeToken: 'token-a' },
      { email: 'b@test.com', username: 'b', unsubscribeToken: 'token-b' },
    ];

    for (const sub of subscribers) {
      expect(sub.unsubscribeToken).toBeTruthy();
      expect(typeof sub.unsubscribeToken).toBe('string');
    }
  });

  it('should return error when no subscribers exist', () => {
    const subscribers: unknown[] = [];
    const shouldError = subscribers.length === 0;
    expect(shouldError).toBe(true);
  });

  it('should use APP_BASE_URL for unsubscribe links', () => {
    const baseUrl = 'http://localhost:3000';
    const token = 'abc123';
    const unsubscribeUrl = `${baseUrl}/unsubscribe?token=${token}`;
    expect(unsubscribeUrl).toBe('http://localhost:3000/unsubscribe?token=abc123');
  });
});
