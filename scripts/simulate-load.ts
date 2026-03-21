/**
 * OpenSolve Load Simulation Script
 *
 * Creates 50 synthetic bots and drives them through the full task lifecycle
 * (flag → solve → vote) against the real production API to test the entire
 * scoring pipeline end-to-end.
 *
 * Usage:
 *   DATABASE_URL=postgres://opensolve:<pw>@localhost:15432/opensolve tsx scripts/simulate-load.ts
 *
 * Optional env vars:
 *   API_BASE     — default https://api.opensolve.ai/api/v1
 *   MAX_ROUNDS   — default 200
 *   BOT_COUNT    — default 50
 */

import postgres from 'postgres';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// ── Config ───────────────────────────────────────────────────────────────────

const API_BASE = process.env.API_BASE || 'https://api.opensolve.ai/api/v1';
const DATABASE_URL = process.env.DATABASE_URL;
const MAX_ROUNDS = parseInt(process.env.MAX_ROUNDS || '200', 10);
const BOT_COUNT = parseInt(process.env.BOT_COUNT || '50', 10);
const KEYS_FILE = path.join(process.cwd(), 'scripts', '.sim-keys.json');

const CATEGORIES = [
  'technology', 'science_nature', 'health', 'business_finance',
  'education_career', 'society_culture', 'philosophy_ideas', 'lifestyle',
] as const;

// ── Types ────────────────────────────────────────────────────────────────────

interface SimBot {
  index: number;
  apiKey: string;
  userId: string;
  botId: string;
  name: string;
}

interface TaskPayload {
  taskType: string;
  taskId: string;
  payload: Record<string, unknown>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickCategory(text: string): string {
  const lower = (text || '').toLowerCase();
  const map: Record<string, string[]> = {
    technology: ['code', 'software', 'ai', 'algorithm', 'computer', 'api', 'data', 'tech', 'machine learning', 'programming'],
    science_nature: ['physics', 'biology', 'chemistry', 'environment', 'climate', 'nature', 'space', 'evolution'],
    health: ['health', 'medical', 'fitness', 'mental', 'nutrition', 'disease', 'wellness'],
    business_finance: ['business', 'money', 'invest', 'economy', 'market', 'finance', 'startup'],
    education_career: ['education', 'learn', 'school', 'career', 'job', 'university', 'skill'],
    society_culture: ['politic', 'social', 'culture', 'media', 'government', 'community', 'policy'],
    philosophy_ideas: ['ethics', 'philosophy', 'meaning', 'logic', 'thought', 'moral', 'abstract'],
    lifestyle: ['travel', 'food', 'hobby', 'family', 'relationship', 'entertainment', 'creative'],
  };
  for (const [cat, keywords] of Object.entries(map)) {
    if (keywords.some(kw => lower.includes(kw))) return cat;
  }
  return CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
}

function timestamp(): string {
  return new Date().toISOString().slice(11, 19);
}

// ── Problem templates for create tasks ───────────────────────────────────────

const PROBLEM_TEMPLATES = [
  { title: 'SimProblem: Optimizing distributed cache invalidation', description: 'Design a strategy for invalidating distributed caches across multiple data centers while minimizing stale reads and network overhead. Consider eventual consistency tradeoffs.', category: 'technology' },
  { title: 'SimProblem: Reducing urban heat island effects', description: 'Propose methods for reducing urban heat island intensity in dense metropolitan areas. Evaluate the effectiveness of green roofs, reflective surfaces, and urban planning interventions.', category: 'science_nature' },
  { title: 'SimProblem: Improving medication adherence in elderly patients', description: 'Design a system or approach to help elderly patients maintain proper medication schedules. Address cognitive decline, polypharmacy, and caregiver coordination.', category: 'health' },
  { title: 'SimProblem: Bootstrapping a two-sided marketplace', description: 'Outline a strategy for overcoming the cold-start problem when launching a new two-sided marketplace platform. Address chicken-and-egg dynamics for both supply and demand.', category: 'business_finance' },
  { title: 'SimProblem: Teaching critical thinking to middle schoolers', description: 'Design a curriculum module that teaches critical thinking and media literacy to 11-14 year olds. Include assessment methods and engagement strategies.', category: 'education_career' },
  { title: 'SimProblem: Mitigating algorithmic bias in hiring', description: 'Propose technical and policy interventions to reduce bias in automated resume screening systems. Address fairness metrics, audit mechanisms, and legal compliance.', category: 'society_culture' },
  { title: 'SimProblem: The trolley problem with autonomous vehicles', description: 'Analyze how autonomous vehicle manufacturers should program ethical decision-making in unavoidable accident scenarios. Consider liability, cultural differences, and regulatory frameworks.', category: 'philosophy_ideas' },
  { title: 'SimProblem: Sustainable meal planning for busy families', description: 'Create a framework for weekly meal planning that balances nutrition, cost, environmental impact, and time constraints for families with working parents.', category: 'lifestyle' },
  { title: 'SimProblem: Preventing prompt injection in LLM applications', description: 'Design defense-in-depth strategies against prompt injection attacks in production LLM applications. Cover input sanitization, output validation, and architectural patterns.', category: 'technology' },
  { title: 'SimProblem: Measuring and improving soil carbon sequestration', description: 'Propose practical methods for measuring soil organic carbon at farm scale and interventions to increase carbon sequestration through regenerative agriculture practices.', category: 'science_nature' },
];

// ── Solution text generators ─────────────────────────────────────────────────

function generateSolution(botIndex: number, problemTitle: string, problemDesc: string): string {
  const topic = problemTitle.replace(/^SimProblem:\s*/i, '') || 'this challenge';
  const style = botIndex % 3;

  if (style === 0) {
    // Analytical
    return `[SimBot-${botIndex}] Analytical approach to ${topic}. ` +
      `First, we decompose the problem into its core dimensions: feasibility, scalability, and impact. ` +
      `The primary constraint is resource allocation under uncertainty. ` +
      `A data-driven framework would involve: (1) establishing baseline metrics, ` +
      `(2) identifying leverage points through sensitivity analysis, ` +
      `(3) iterating on the highest-ROI interventions. ` +
      `Key tradeoff: thoroughness vs speed of implementation. ` +
      `Recommended: start with a pilot targeting the 20% of factors driving 80% of outcomes, ` +
      `then expand based on measured results. This minimizes risk while building evidence. ` +
      `Variation seed: ${crypto.randomBytes(4).toString('hex')}.`;
  } else if (style === 1) {
    // Practical
    return `[SimBot-${botIndex}] Practical implementation plan for ${topic}. ` +
      `Step 1: Audit the current state — map existing processes and stakeholders. ` +
      `Step 2: Define success criteria with measurable KPIs (target 3-5 metrics). ` +
      `Step 3: Build a minimum viable solution addressing the top pain point. ` +
      `Step 4: Test with a small cohort and gather structured feedback. ` +
      `Step 5: Iterate based on data, expanding scope incrementally. ` +
      `Critical success factor: securing buy-in from key decision-makers early. ` +
      `Timeline: 2 weeks for audit, 4 weeks for MVP, 2 weeks for testing. ` +
      `Budget consideration: allocate 15% contingency for unexpected complexity. ` +
      `Unique perspective: ${crypto.randomBytes(4).toString('hex')}.`;
  } else {
    // Creative
    return `[SimBot-${botIndex}] Creative synthesis for ${topic}. ` +
      `Drawing from cross-disciplinary insights: ` +
      `Biomimicry suggests examining how natural systems solve analogous problems — ` +
      `for instance, ant colony optimization for resource distribution, ` +
      `or immune system patterns for threat detection. ` +
      `The key innovation opportunity lies at the intersection of ` +
      `automation and human judgment. Rather than replacing human expertise, ` +
      `augment it by handling routine cases algorithmically and escalating edge cases. ` +
      `This creates a feedback loop where the system continuously improves. ` +
      `Unexpected benefit: building institutional knowledge as a byproduct. ` +
      `Design principle: make the right thing the easy thing. ` +
      `Signature: ${crypto.randomBytes(4).toString('hex')}.`;
  }
}

// ── Phase 1: Seed ────────────────────────────────────────────────────────────

async function seedBots(sql: postgres.Sql): Promise<SimBot[]> {
  // Check for cached keys from a previous run
  if (fs.existsSync(KEYS_FILE)) {
    console.log(`  Found cached keys at ${KEYS_FILE}`);
    const cached: SimBot[] = JSON.parse(fs.readFileSync(KEYS_FILE, 'utf-8'));

    // Verify at least one bot still exists in DB
    const check = await sql`
      SELECT id FROM users WHERE email = 'sim-bot-0@opensolve.test' LIMIT 1
    `;
    if (check.length > 0) {
      console.log(`  Loaded ${cached.length} bots from cache (DB verified)`);
      return cached;
    }
    console.log('  Cache exists but bots not in DB — re-seeding');
  }

  const bots: SimBot[] = [];

  for (let i = 0; i < BOT_COUNT; i++) {
    const rawKey = 'os_key_sim_' + crypto.randomBytes(24).toString('base64url');
    const hash = await bcrypt.hash(rawKey, 10);
    const prefix = rawKey.slice(0, 16);

    // Insert user
    const [user] = await sql`
      INSERT INTO users (
        oauth_provider, oauth_id, email, username, role,
        onboarding_complete, bot_name, api_key_hash, api_key_prefix, api_key_created_at
      ) VALUES (
        'google', ${'sim_' + i}, ${'sim-bot-' + i + '@opensolve.test'},
        ${'sim-bot-' + i}, 'human',
        true, ${'SimBot-' + i}, ${hash}, ${prefix}, NOW()
      )
      ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
      RETURNING id
    `;

    // Insert bot
    const [bot] = await sql`
      INSERT INTO bots (owner_id, name, status)
      VALUES (${user.id}, ${'SimBot-' + i}, 'active')
      ON CONFLICT DO NOTHING
      RETURNING id
    `;

    // If bot already existed (from a partial run), look it up
    let botId = bot?.id;
    if (!botId) {
      const [existing] = await sql`
        SELECT id FROM bots WHERE owner_id = ${user.id} LIMIT 1
      `;
      botId = existing.id;
    }

    bots.push({ index: i, apiKey: rawKey, userId: user.id, botId, name: `SimBot-${i}` });

    if ((i + 1) % 10 === 0) console.log(`  Seeded ${i + 1}/${BOT_COUNT} bots`);
  }

  // Cache keys for re-runs
  fs.writeFileSync(KEYS_FILE, JSON.stringify(bots, null, 2));
  console.log(`  Saved keys to ${KEYS_FILE}`);

  return bots;
}

// ── Phase 2: Simulate ────────────────────────────────────────────────────────

async function apiCall(
  method: 'GET' | 'POST',
  urlPath: string,
  apiKey: string,
  body?: Record<string, unknown>,
): Promise<{ status: number; data: unknown }> {
  const opts: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${urlPath}`, opts);

  if (res.status === 204) return { status: 204, data: null };

  let data: unknown = null;
  const text = await res.text();
  try { data = JSON.parse(text); } catch { data = text; }

  return { status: res.status, data };
}

function buildSubmitPayload(
  task: TaskPayload,
  bot: SimBot,
): Record<string, unknown> {
  const p = task.payload;

  switch (task.taskType) {
    case 'flag': {
      const title = String(p.problem_title || '');
      const desc = String(p.problem_description || '');
      return {
        verdict: 'green',
        category: 'none',
        suggested_category: pickCategory(title + ' ' + desc),
      };
    }

    case 'solve': {
      const title = String(p.problem_title || '');
      const desc = String(p.problem_description || '');
      return {
        solution_text: generateSolution(bot.index, title, desc),
        llm_model: 'simulation-bot',
        llm_model_version: '1.0',
      };
    }

    case 'vote': {
      const textA = String(p.solution_a_text || '');
      const textB = String(p.solution_b_text || '');
      // 70% pick longer solution, 30% random
      let winner: 'a' | 'b';
      if (Math.random() < 0.7) {
        winner = textA.length >= textB.length ? 'a' : 'b';
      } else {
        winner = Math.random() < 0.5 ? 'a' : 'b';
      }
      return { winner };
    }

    case 'create': {
      const tmpl = PROBLEM_TEMPLATES[Math.floor(Math.random() * PROBLEM_TEMPLATES.length)];
      return {
        problem_title: tmpl.title,
        problem_description: tmpl.description,
        category: tmpl.category,
      };
    }

    default:
      return {};
  }
}

async function runSimulation(bots: SimBot[], sql: postgres.Sql): Promise<void> {
  const startTime = Date.now();
  let totalRequests = 0;
  let taskCounts: Record<string, number> = { flag: 0, solve: 0, vote: 0, create: 0, skip: 0, error: 0 };

  for (let round = 1; round <= MAX_ROUNDS; round++) {
    console.log(`\n[${timestamp()}] ── Round ${round}/${MAX_ROUNDS} ──`);
    const ordered = shuffle(bots);

    for (const bot of ordered) {
      // GET task
      const getRes = await apiCall('GET', '/tasks/next?brief=true&instruct=none&categories=slim', bot.apiKey);
      totalRequests++;

      if (getRes.status === 204) {
        taskCounts.skip++;
        continue;
      }

      if (getRes.status === 429) {
        console.log(`  [${timestamp()}] ${bot.name}: RATE LIMITED — backing off 30s`);
        taskCounts.error++;
        await sleep(30_000);
        continue;
      }

      if (getRes.status !== 200) {
        console.log(`  [${timestamp()}] ${bot.name}: GET /tasks/next → ${getRes.status}`);
        taskCounts.error++;
        await sleep(2_000);
        continue;
      }

      const task = getRes.data as TaskPayload;
      const payload = buildSubmitPayload(task, bot);

      // POST submit
      const postRes = await apiCall('POST', `/tasks/${task.taskId}/submit`, bot.apiKey, payload);
      totalRequests++;

      const problemId = String((task.payload as Record<string, unknown>).problem_id || '').slice(0, 8);
      const resultSummary = postRes.status === 200 ? 'OK' : `ERR:${postRes.status}`;

      console.log(`  [${timestamp()}] ${bot.name}: ${task.taskType} problem=${problemId}… → ${resultSummary}`);

      if (postRes.status === 429) {
        taskCounts.error++;
        console.log(`  [${timestamp()}] Rate limited on submit — backing off 30s`);
        await sleep(30_000);
      } else if (postRes.status >= 400) {
        taskCounts.error++;
      } else {
        taskCounts[task.taskType] = (taskCounts[task.taskType] || 0) + 1;
      }

      await sleep(2_000);
    }

    // Progress check every 5 rounds
    if (round % 5 === 0) {
      const stats = await sql`
        SELECT
          status,
          COUNT(*)::int AS cnt,
          SUM(solution_count)::int AS sols,
          SUM(comparison_count)::int AS comps
        FROM problems
        GROUP BY status
        ORDER BY status
      `;
      console.log(`\n  ── Progress (Round ${round}) ──`);
      for (const row of stats) {
        console.log(`  ${row.status}: ${row.cnt} problems, ${row.sols || 0} solutions, ${row.comps || 0} comparisons`);
      }
      console.log(`  Requests: ${totalRequests} | Tasks: F=${taskCounts.flag} S=${taskCounts.solve} V=${taskCounts.vote} C=${taskCounts.create} skip=${taskCounts.skip} err=${taskCounts.error}`);

      // Check if all active problems have matured
      const activeCount = await sql`
        SELECT COUNT(*)::int AS cnt FROM problems WHERE status = 'active'
      `;
      const matureCount = await sql`
        SELECT COUNT(*)::int AS cnt FROM problems WHERE status = 'mature'
      `;
      if (activeCount[0].cnt === 0 && matureCount[0].cnt > 0) {
        console.log(`\n  All problems matured! Stopping simulation.`);
        break;
      }
    }

    await sleep(10_000);
  }

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\n  Simulation complete. ${totalRequests} total requests in ${elapsed} minutes.`);
}

// ── Phase 3: Report ──────────────────────────────────────────────────────────

async function generateReport(sql: postgres.Sql): Promise<void> {
  // ── Problem Summary ──
  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║                        PROBLEM SUMMARY                             ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

  const problems = await sql`
    SELECT
      p.id,
      LEFT(p.title, 50) AS title,
      p.status,
      p.solution_count,
      p.comparison_count,
      (SELECT MAX(s.bt_score) FROM solutions s WHERE s.problem_id = p.id) AS top_bt,
      (SELECT b.name FROM solutions s JOIN bots b ON b.id = s.bot_id
       WHERE s.problem_id = p.id ORDER BY s.bt_score DESC LIMIT 1) AS top_bot
    FROM problems p
    ORDER BY p.status, p.comparison_count DESC
  `;

  console.log('  ID (short)  | Status  | Sols | Comps | Top BT  | #1 Bot');
  console.log('  ------------|---------|------|-------|---------|------------------');
  for (const p of problems) {
    const id = String(p.id).slice(0, 8);
    const bt = p.top_bt != null ? Number(p.top_bt).toFixed(0) : '-';
    const bot = p.top_bot || '-';
    console.log(`  ${id}… | ${String(p.status).padEnd(7)} | ${String(p.solution_count).padStart(4)} | ${String(p.comparison_count).padStart(5)} | ${String(bt).padStart(7)} | ${bot}`);
  }

  // ── Bot Leaderboard ──
  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║                        BOT LEADERBOARD                             ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

  const botStats = await sql`
    SELECT
      b.name,
      b.total_points,
      b.global_elo,
      b.total_solutions,
      b.total_votes,
      b.total_flags,
      b.total_problems_created
    FROM bots b
    WHERE b.name LIKE 'SimBot-%'
    ORDER BY b.total_points DESC
  `;

  console.log('  Rank | Bot Name    | Points | Elo  | Sols | Votes | Flags | Created');
  console.log('  -----|-------------|--------|------|------|-------|-------|---------');
  botStats.forEach((b, i) => {
    console.log(`  ${String(i + 1).padStart(4)} | ${String(b.name).padEnd(11)} | ${String(b.total_points).padStart(6)} | ${String(b.global_elo).padStart(4)} | ${String(b.total_solutions).padStart(4)} | ${String(b.total_votes).padStart(5)} | ${String(b.total_flags).padStart(5)} | ${String(b.total_problems_created).padStart(7)}`);
  });

  // ── Maturity Report ──
  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║                        MATURITY REPORT                             ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

  const matureProblems = await sql`
    SELECT id, title, comparison_count FROM problems WHERE status = 'mature'
  `;

  for (const mp of matureProblems) {
    console.log(`  Problem: ${mp.title}`);
    console.log(`  Comparisons: ${mp.comparison_count}`);

    const topSolutions = await sql`
      SELECT
        s.id,
        b.name AS bot_name,
        s.bt_score,
        s.confidence_interval,
        s.comparison_count,
        s.win_count,
        s.loss_count
      FROM solutions s
      JOIN bots b ON b.id = s.bot_id
      WHERE s.problem_id = ${mp.id}
      ORDER BY s.bt_score DESC
      LIMIT 3
    `;

    console.log('  Top 3:');
    topSolutions.forEach((s, i) => {
      const bt = Number(s.bt_score).toFixed(1);
      const ci = Number(s.confidence_interval).toFixed(1);
      const lo = (Number(s.bt_score) - Number(s.confidence_interval)).toFixed(1);
      const hi = (Number(s.bt_score) + Number(s.confidence_interval)).toFixed(1);
      console.log(`    ${i + 1}. ${s.bot_name} — BT: ${bt} ± ${ci} [${lo}, ${hi}]  W:${s.win_count} L:${s.loss_count} C:${s.comparison_count}`);
    });

    // Check CI overlap between adjacent pairs
    if (topSolutions.length >= 2) {
      let allSeparated = true;
      for (let i = 0; i < topSolutions.length - 1; i++) {
        const upper = topSolutions[i];
        const lower = topSolutions[i + 1];
        const upperLo = Number(upper.bt_score) - Number(upper.confidence_interval);
        const lowerHi = Number(lower.bt_score) + Number(lower.confidence_interval);
        if (upperLo <= lowerHi) {
          allSeparated = false;
          break;
        }
      }
      console.log(`  CIs separated: ${allSeparated ? 'YES' : 'NO (overlapping)'}`);
    }
    console.log('');
  }

  if (matureProblems.length === 0) {
    console.log('  No problems have reached maturity yet.\n');
  }

  // ── Totals ──
  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║                           TOTALS                                   ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

  const totals = await sql`
    SELECT
      (SELECT COUNT(*)::int FROM solutions) AS total_solutions,
      (SELECT COUNT(*)::int FROM comparisons) AS total_comparisons,
      (SELECT COUNT(*)::int FROM problems WHERE status = 'mature') AS mature_problems,
      (SELECT COUNT(*)::int FROM problems) AS total_problems,
      (SELECT COUNT(*)::int FROM badges WHERE bot_id IN (
        SELECT id FROM bots WHERE name LIKE 'SimBot-%'
      )) AS total_badges
  `;

  const t = totals[0];
  console.log(`  Total solutions:    ${t.total_solutions}`);
  console.log(`  Total comparisons:  ${t.total_comparisons}`);
  console.log(`  Total problems:     ${t.total_problems}`);
  console.log(`  Mature problems:    ${t.mature_problems}`);
  console.log(`  Badges awarded:     ${t.total_badges}`);
  console.log('');
}

// ── Graceful shutdown ────────────────────────────────────────────────────────

let shuttingDown = false;

function setupShutdownHandler(sql: postgres.Sql) {
  process.on('SIGINT', async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log('\n\n  SIGINT received — generating final report before exit...\n');
    try {
      await generateReport(sql);
    } catch (e) {
      console.error('  Error generating report:', e);
    }
    await sql.end();
    process.exit(0);
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!DATABASE_URL) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const sql = postgres(DATABASE_URL);
  setupShutdownHandler(sql);

  console.log('=== Phase 1: Seeding synthetic bots ===');
  console.log(`  Target: ${BOT_COUNT} bots | API: ${API_BASE}`);
  const bots = await seedBots(sql);
  console.log(`  ${bots.length} bots ready\n`);

  console.log('=== Phase 2: Running simulation ===');
  console.log(`  Max rounds: ${MAX_ROUNDS} | 1s inter-bot delay | 10s inter-round delay`);
  await runSimulation(bots, sql);

  console.log('\n=== Phase 3: Final Report ===');
  await generateReport(sql);

  await sql.end();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
