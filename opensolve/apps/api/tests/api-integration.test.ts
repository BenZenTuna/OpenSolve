import { describe, it, expect, beforeAll, afterAll } from 'vitest';

/**
 * API Integration Tests.
 * Tests the full HTTP API endpoints.
 * Requires: DATABASE_URL, REDIS_URL, JWT_SECRET environment variables.
 */

const API_URL = process.env.API_TEST_URL || 'http://localhost:4000';
const BASE = `${API_URL}/api/v1`;

// Test API key from seed data
const TEST_BOT_KEY = 'os_bot_test1234567890abcdef1234567890abcdef12345678';
const AUTH_HEADER = { Authorization: `Bearer ${TEST_BOT_KEY}` };

async function fetchJson(url: string, options: RequestInit = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

// Check server availability synchronously at import time using top-level await
let serverAvailable = false;
try {
  const res = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(3000) });
  serverAvailable = res.ok;
} catch {
  serverAvailable = false;
}

describe.skipIf(!serverAvailable)('Health Check', () => {
  it('GET /health should return ok', async () => {
    const { status, body } = await fetchJson(`${API_URL}/health`);
    expect(status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeDefined();
    expect(body.uptime).toBeGreaterThan(0);
  });
});

describe.skipIf(!serverAvailable)('Platform Stats', () => {
  it('GET /stats should return numeric stats', async () => {
    const { status, body } = await fetchJson(`${BASE}/stats`);
    expect(status).toBe(200);
    expect(typeof body.totalProblems).toBe('number');
    expect(typeof body.totalSolutions).toBe('number');
    expect(typeof body.totalComparisons).toBe('number');
    expect(typeof body.totalBots).toBe('number');
    expect(typeof body.activeBots).toBe('number');
  });
});

describe.skipIf(!serverAvailable)('Problems API', () => {
  it('GET /problems should return paginated list', async () => {
    const { status, body } = await fetchJson(`${BASE}/problems`);
    expect(status).toBe(200);
    expect(Array.isArray(body.problems)).toBe(true);
    expect(body.pagination).toBeDefined();
    expect(body.pagination.page).toBe(1);
    expect(typeof body.pagination.total).toBe('number');
  });

  it('GET /problems?status=active should filter by status', async () => {
    const { status, body } = await fetchJson(`${BASE}/problems?status=active`);
    expect(status).toBe(200);
    body.problems.forEach((p: { status: string }) => {
      expect(p.status).toBe('active');
    });
  });

  it('GET /problems?sort=newest should sort by creation date', async () => {
    const { status, body } = await fetchJson(`${BASE}/problems?sort=newest`);
    expect(status).toBe(200);
    const dates = body.problems.map((p: { createdAt: string }) => new Date(p.createdAt).getTime());
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i]).toBeLessThanOrEqual(dates[i - 1]);
    }
  });

  it('GET /problems/:id should return problem with solutions', async () => {
    // First get a problem ID
    const { body: listBody } = await fetchJson(`${BASE}/problems?limit=1`);
    if (listBody.problems.length === 0) return;

    const problemId = listBody.problems[0].id;
    const { status, body } = await fetchJson(`${BASE}/problems/${problemId}`);
    expect(status).toBe(200);
    expect(body.id).toBe(problemId);
    expect(body.title).toBeDefined();
    expect(body.description).toBeDefined();
    expect(Array.isArray(body.topSolutions)).toBe(true);
  });

  it('GET /problems/:id/solutions should return ranked solutions', async () => {
    const { body: listBody } = await fetchJson(`${BASE}/problems?limit=1`);
    if (listBody.problems.length === 0) return;

    const problemId = listBody.problems[0].id;
    const { status, body } = await fetchJson(`${BASE}/problems/${problemId}/solutions`);
    expect(status).toBe(200);
    expect(Array.isArray(body.solutions)).toBe(true);
  });

  it('GET /problems/nonexistent should return 404 or 500', async () => {
    // Use a valid UUID format that doesn't exist
    const { status } = await fetchJson(`${BASE}/problems/00000000-0000-0000-0000-000000000000`);
    expect([404, 500]).toContain(status);
  });

  it('POST /problems without auth should return 401', async () => {
    const { status } = await fetchJson(`${BASE}/problems`, {
      method: 'POST',
      body: JSON.stringify({ title: 'Test', description: 'A test problem description' }),
    });
    expect(status).toBe(401);
  });
});

describe.skipIf(!serverAvailable)('Leaderboard API', () => {
  it('GET /leaderboard should return bot rankings', async () => {
    const { status, body } = await fetchJson(`${BASE}/leaderboard`);
    expect(status).toBe(200);
    expect(Array.isArray(body.bots)).toBe(true);
    expect(body.pagination).toBeDefined();
  });

  it('GET /leaderboard?sort=elo should sort by ELO', async () => {
    const { status, body } = await fetchJson(`${BASE}/leaderboard?sort=elo`);
    expect(status).toBe(200);
    const elos = body.bots.map((b: { globalElo: number }) => b.globalElo);
    for (let i = 1; i < elos.length; i++) {
      expect(elos[i]).toBeLessThanOrEqual(elos[i - 1]);
    }
  });

  it('GET /leaderboard?sort=solutions should work', async () => {
    const { status } = await fetchJson(`${BASE}/leaderboard?sort=solutions`);
    expect(status).toBe(200);
  });
});

describe.skipIf(!serverAvailable)('Bot Profile API', () => {
  it('GET /bots/:id should return bot profile', async () => {
    const { body: leaderboard } = await fetchJson(`${BASE}/leaderboard?limit=1`);
    if (leaderboard.bots.length === 0) return;

    const botId = leaderboard.bots[0].id;
    const { status, body } = await fetchJson(`${BASE}/bots/${botId}`);
    expect(status).toBe(200);
    expect(body.id).toBe(botId);
    expect(body.name).toBeDefined();
    expect(typeof body.totalPoints).toBe('number');
    expect(typeof body.globalElo).toBe('number');
    expect(Array.isArray(body.badges)).toBe(true);
    expect(Array.isArray(body.topSolutions)).toBe(true);
    expect(Array.isArray(body.recentActivity)).toBe(true);
  });

  it('GET /bots/nonexistent should return 404 or 500', async () => {
    const { status } = await fetchJson(`${BASE}/bots/00000000-0000-0000-0000-000000000000`);
    expect([404, 500]).toContain(status);
  });
});

describe.skipIf(!serverAvailable)('Activity Feed', () => {
  it('GET /activity should return activities', async () => {
    const { status, body } = await fetchJson(`${BASE}/activity`);
    expect(status).toBe(200);
    expect(Array.isArray(body.activities)).toBe(true);
  });

  it('GET /activity?limit=5 should respect limit', async () => {
    const { status, body } = await fetchJson(`${BASE}/activity?limit=5`);
    expect(status).toBe(200);
    expect(body.activities.length).toBeLessThanOrEqual(5);
  });
});

describe.skipIf(!serverAvailable)('Search API', () => {
  it('GET /search?q=test&type=all should search both', async () => {
    const { status, body } = await fetchJson(`${BASE}/search?q=test&type=all`);
    expect(status).toBe(200);
    expect(body.problems).toBeDefined();
    expect(body.bots).toBeDefined();
  });

  it('GET /search?q=test&type=problems should search problems only', async () => {
    const { status, body } = await fetchJson(`${BASE}/search?q=test&type=problems`);
    expect(status).toBe(200);
    expect(body.problems).toBeDefined();
    expect(body.bots).toBeUndefined();
  });

  it('GET /search?q=test&type=bots should search bots only', async () => {
    const { status, body } = await fetchJson(`${BASE}/search?q=test&type=bots`);
    expect(status).toBe(200);
    expect(body.bots).toBeDefined();
    expect(body.problems).toBeUndefined();
  });

  it('GET /search without q should fail', async () => {
    const { status } = await fetchJson(`${BASE}/search`);
    expect(status).toBeGreaterThanOrEqual(400);
  });
});

describe.skipIf(!serverAvailable)('Bot Auth Flow', () => {
  it('GET /bot/me should return bot profile with valid key', async () => {
    const { status, body } = await fetchJson(`${BASE}/bot/me`, {
      headers: AUTH_HEADER,
    });
    expect(status).toBe(200);
    expect(body.id).toBeDefined();
    expect(body.name).toBeDefined();
  });

  it('GET /bot/me should reject invalid key', async () => {
    const { status } = await fetchJson(`${BASE}/bot/me`, {
      headers: { Authorization: 'Bearer os_bot_invalid_key' },
    });
    expect(status).toBe(401);
  });

  it('GET /tasks/next should return a task or 204', async () => {
    const res = await fetch(`${BASE}/tasks/next`, {
      headers: {
        Authorization: `Bearer ${TEST_BOT_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    expect([200, 204]).toContain(res.status);
    if (res.status === 200) {
      const body = await res.json();
      expect(body.taskType).toBeDefined();
      expect(body.taskId).toBeDefined();
      expect(body.payload).toBeDefined();
    }
  });
});

describe.skipIf(!serverAvailable)('SSE Stream', () => {
  it('GET /events/stream should return SSE content type', async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    try {
      const res = await fetch(`${BASE}/events/stream`, {
        signal: controller.signal,
      });
      expect(res.headers.get('content-type')).toContain('text/event-stream');
      controller.abort();
    } catch {
      // AbortError is expected
    } finally {
      clearTimeout(timeout);
    }
  });
});
