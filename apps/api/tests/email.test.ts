import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  importantMessageTemplate,
  newsletterTemplate,
  newsletterConfirmTemplate,
  unsubscribeConfirmTemplate,
} from '../src/email/templates.js';

// ---------------------------------------------------------------------------
// Template unit tests (pure functions — no mocks needed)
// ---------------------------------------------------------------------------

describe('Email Templates', () => {
  describe('importantMessageTemplate', () => {
    it('should contain the subject and username', () => {
      const html = importantMessageTemplate({
        subject: 'Privacy Policy Update',
        bodyHtml: '<p>We updated our privacy policy.</p>',
        username: 'alice',
      });
      expect(html).toContain('Privacy Policy Update');
      expect(html).toContain('alice');
      expect(html).toContain('We updated our privacy policy.');
      expect(html).toContain('opensolve.ai');
    });

    it('should NOT contain an unsubscribe link', () => {
      const html = importantMessageTemplate({
        subject: 'Test',
        bodyHtml: '<p>Body</p>',
        username: 'bob',
      });
      expect(html.toLowerCase()).not.toContain('unsubscribe');
    });
  });

  describe('newsletterTemplate', () => {
    it('should contain the unsubscribeUrl', () => {
      const html = newsletterTemplate({
        subject: 'Weekly Digest',
        bodyHtml: '<p>This week in AI solving.</p>',
        username: 'carol',
        unsubscribeUrl: 'https://opensolve.ai/unsubscribe?token=abc123',
      });
      expect(html).toContain('https://opensolve.ai/unsubscribe?token=abc123');
      expect(html).toContain('carol');
      expect(html).toContain('This week in AI solving.');
    });

    it('should have a visible unsubscribe link', () => {
      const html = newsletterTemplate({
        subject: 'Test',
        bodyHtml: '<p>Body</p>',
        username: 'dave',
        unsubscribeUrl: 'https://example.com/unsub',
      });
      expect(html).toContain('Unsubscribe');
      expect(html).toContain('href="https://example.com/unsub"');
    });
  });

  describe('newsletterConfirmTemplate', () => {
    it('should contain the confirmUrl and expiry note', () => {
      const html = newsletterConfirmTemplate({
        username: 'eve',
        confirmUrl: 'https://opensolve.ai/confirm?token=xyz',
      });
      expect(html).toContain('https://opensolve.ai/confirm?token=xyz');
      expect(html).toContain('eve');
      expect(html).toContain('24 hours');
      expect(html).toContain('Confirm Subscription');
    });
  });

  describe('unsubscribeConfirmTemplate', () => {
    it('should confirm unsubscribe and link to settings', () => {
      const html = unsubscribeConfirmTemplate({ username: 'frank' });
      expect(html).toContain('frank');
      expect(html).toContain("You've been unsubscribed");
      expect(html).toContain('opensolve.ai/settings');
    });
  });
});

// ---------------------------------------------------------------------------
// EmailService tests (mock Resend SDK)
// ---------------------------------------------------------------------------

// Mock the Resend SDK before importing EmailService
vi.mock('resend', () => {
  const mockSend = vi.fn();
  return {
    Resend: vi.fn().mockImplementation(() => ({
      emails: { send: mockSend },
    })),
    __mockSend: mockSend,
  };
});

// Mock env to provide test values
vi.mock('../src/config/env.js', () => ({
  env: {
    RESEND_API_KEY: 'test_key',
    RESEND_FROM_EMAIL: 'noreply@test.com',
    RESEND_FROM_NAME: 'TestSolve',
    NODE_ENV: 'test',
    PORT: 4000,
    DATABASE_URL: 'postgres://localhost/test',
    REDIS_URL: 'redis://localhost',
    JWT_SECRET: 'testsecretthatis16chars',
    API_URL: 'http://localhost:4000',
    WEB_URL: 'http://localhost:3000',
  },
}));

// Mock logger
vi.mock('../src/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('EmailService', () => {
  let EmailService: typeof import('../src/services/email.service.js').EmailService;
  let mockSend: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Dynamic import after mocks are set up
    const mod = await import('../src/services/email.service.js');
    EmailService = mod.EmailService;
    const resendMod = await import('resend') as unknown as { __mockSend: ReturnType<typeof vi.fn> };
    mockSend = resendMod.__mockSend;
  });

  it('should call Resend with correct from/to/subject for sendImportantMessage', async () => {
    mockSend.mockResolvedValueOnce({ data: { id: 'msg_123' }, error: null });

    const service = new EmailService();
    const result = await service.sendImportantMessage({
      to: 'user@example.com',
      toName: 'TestUser',
      subject: 'Important Notice',
      bodyHtml: '<p>Hello</p>',
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('msg_123');
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'TestSolve <noreply@test.com>',
        to: 'user@example.com',
        subject: 'Important Notice',
      }),
    );
  });

  it('should return correct sent/failed counts for newsletter broadcast', async () => {
    // First two succeed, third fails
    mockSend
      .mockResolvedValueOnce({ data: { id: 'msg_1' }, error: null })
      .mockResolvedValueOnce({ data: { id: 'msg_2' }, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: 'Invalid email' } });

    const service = new EmailService();
    const result = await service.sendNewsletterBroadcast({
      recipients: [
        { email: 'a@test.com', username: 'a', unsubscribeToken: 'tok_a' },
        { email: 'b@test.com', username: 'b', unsubscribeToken: 'tok_b' },
        { email: 'bad@test.com', username: 'c', unsubscribeToken: 'tok_c' },
      ],
      subject: 'Newsletter #1',
      bodyHtml: '<p>News</p>',
      baseUrl: 'https://opensolve.ai',
    });

    expect(result.sent).toBe(2);
    expect(result.failed).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('bad@test.com');
  });

  it('should throw on init if RESEND_API_KEY is missing in production', async () => {
    // Override env for this test
    const envMod = await import('../src/config/env.js') as { env: Record<string, string> };
    const origKey = envMod.env.RESEND_API_KEY;
    const origEnv = envMod.env.NODE_ENV;
    envMod.env.RESEND_API_KEY = '';
    envMod.env.NODE_ENV = 'production';

    expect(() => new EmailService()).toThrow('RESEND_API_KEY is required in production');

    // Restore
    envMod.env.RESEND_API_KEY = origKey;
    envMod.env.NODE_ENV = origEnv;
  });
});
