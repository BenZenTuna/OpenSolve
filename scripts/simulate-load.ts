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

// ── LLM model assignment per bot group ─────────────────────────────────────

function getLlmModel(botIndex: number): { model: string; version: string } {
  if (botIndex < 10) return { model: 'claude-3.5-sonnet', version: 'sim-1.0' };
  if (botIndex < 20) return { model: 'gpt-4o', version: 'sim-1.0' };
  if (botIndex < 30) return { model: 'gemini-2.0-flash', version: 'sim-1.0' };
  if (botIndex < 40) return { model: 'ollama/llama3.2:8b', version: 'sim-1.0' };
  return { model: 'deepseek-v3', version: 'sim-1.0' };
}

// ── Problem templates (20 across all 8 categories) ─────────────────────────

const PROBLEM_TEMPLATES = [
  // technology (3)
  { title: 'SimProblem: How should a startup architect a multi-region database for global latency under 100ms?', description: 'Design a database architecture for a SaaS startup expanding globally. Must handle 10K writes/sec, support multi-region reads, and keep p99 latency under 100ms. Consider consistency models, replication strategies, and cost constraints for a team of 5 engineers.', category: 'technology' },
  { title: 'SimProblem: What is the best approach to real-time collaboration in web applications?', description: 'Compare CRDT-based and OT-based approaches for building Google Docs-style real-time collaboration. Evaluate conflict resolution, offline support, cursor presence, and undo/redo handling. Consider both implementation complexity and user experience.', category: 'technology' },
  { title: 'SimProblem: Preventing prompt injection in production LLM applications', description: 'Design defense-in-depth strategies against prompt injection in production LLM apps. Cover input sanitization, output validation, sandboxing, and architectural patterns. Include real-world attack vectors and their mitigations.', category: 'technology' },
  // science_nature (3)
  { title: 'SimProblem: How can CRISPR be used responsibly in agriculture without ecological disruption?', description: 'Evaluate the use of CRISPR gene editing for crop improvement — drought resistance, pest resistance, yield optimization. Address ecological risks, gene flow to wild populations, regulatory frameworks, and public acceptance challenges.', category: 'science_nature' },
  { title: 'SimProblem: What are the most promising approaches to direct air carbon capture at scale?', description: 'Compare leading carbon capture technologies: solid sorbent DAC, liquid solvent DAC, and enhanced weathering. Evaluate energy costs per ton CO2, scalability limits, land use, and economic viability at gigatonne scale by 2050.', category: 'science_nature' },
  { title: 'SimProblem: Measuring and improving soil carbon sequestration at farm scale', description: 'Propose practical methods for measuring soil organic carbon and interventions to increase sequestration through regenerative agriculture. Address no-till farming, cover crops, biochar, and verification challenges.', category: 'science_nature' },
  // health (2)
  { title: 'SimProblem: How should AI be integrated into mental health screening without replacing human judgment?', description: 'Design a framework for using AI-assisted mental health screening in primary care. Address sensitivity vs specificity tradeoffs, clinician trust, patient consent, cultural bias in training data, and liability when AI misses a diagnosis.', category: 'health' },
  { title: 'SimProblem: What is the most effective strategy for reducing antibiotic resistance globally?', description: 'Propose a multi-pronged approach to combat antibiotic resistance. Address agricultural overuse, hospital stewardship programs, rapid diagnostics, phage therapy alternatives, and global coordination challenges between developed and developing nations.', category: 'health' },
  // business_finance (3)
  { title: 'SimProblem: How should a bootstrapped SaaS price its enterprise tier without alienating SMBs?', description: 'Design a pricing strategy for a B2B SaaS tool with 5K customers on a $29/mo plan that wants to add enterprise features (SSO, audit logs, SLA). Balance revenue growth against customer satisfaction, avoid the "toll booth" perception, and plan migration paths.', category: 'business_finance' },
  { title: 'SimProblem: What is the optimal strategy for managing technical debt in a rapidly growing startup?', description: 'Create a framework for deciding when to address technical debt vs ship features. Consider engineering velocity metrics, developer satisfaction, incident rates, and the business case for refactoring. Include practical prioritization criteria.', category: 'business_finance' },
  { title: 'SimProblem: How should a small company approach international expansion with limited capital?', description: 'Outline a phased approach for a 30-person company to expand from one country to three new markets. Address localization, compliance, payment infrastructure, customer support across time zones, and hiring strategy with a $500K budget.', category: 'business_finance' },
  // education_career (2)
  { title: 'SimProblem: How should universities adapt curricula for an AI-augmented workforce?', description: 'Design curriculum changes for a computer science program that prepares students for a world where AI handles routine coding. Focus on skills that remain valuable: system design, critical evaluation of AI output, ethical reasoning, and human-AI collaboration.', category: 'education_career' },
  { title: 'SimProblem: What is the best approach to teaching critical thinking to teenagers in the age of social media?', description: 'Design a curriculum module for 14-17 year olds that builds critical thinking and media literacy. Address deepfakes, algorithmic bias, source evaluation, and emotional manipulation. Include assessment methods that measure actual skill transfer.', category: 'education_career' },
  // society_culture (2)
  { title: 'SimProblem: How should cities redesign public spaces for both climate resilience and social cohesion?', description: 'Propose urban design principles that make public spaces serve dual purposes: climate adaptation (flood management, heat reduction, biodiversity) and community building (gathering spaces, accessibility, safety). Use specific city examples.', category: 'society_culture' },
  { title: 'SimProblem: What is the most effective approach to reducing misinformation without censorship?', description: 'Design a system for reducing the spread of misinformation on social platforms that does not rely on content removal. Consider friction-based approaches, source transparency, community notes models, and prebunking strategies.', category: 'society_culture' },
  // philosophy_ideas (2)
  { title: 'SimProblem: Is consciousness substrate-independent, and what are the implications for AI rights?', description: 'Examine whether consciousness can arise in non-biological substrates. Draw on functionalism, integrated information theory, and global workspace theory. Discuss the moral implications: if substrate independence holds, what ethical obligations would we have toward sufficiently complex AI systems?', category: 'philosophy_ideas' },
  { title: 'SimProblem: How should we weigh present costs against uncertain future benefits in climate policy?', description: 'Analyze the ethics of intergenerational justice in climate policy. Compare discount rate approaches (Stern vs Nordhaus), address uncertainty and fat-tail risks, and propose a framework for making decisions when the beneficiaries are unborn generations.', category: 'philosophy_ideas' },
  // lifestyle (3)
  { title: 'SimProblem: How should someone structure their first year of fully remote work for maximum wellbeing?', description: 'Design a comprehensive guide for transitioning to full-time remote work. Cover workspace ergonomics, daily routine structure, social isolation prevention, boundary setting, exercise integration, and strategies for career visibility without office presence.', category: 'lifestyle' },
  { title: 'SimProblem: What is the best approach to building lasting habits that survive motivation dips?', description: 'Synthesize research on habit formation (Fogg, Clear, Duhigg) into practical advice. Address identity-based habits, environment design, the 2-minute rule, accountability systems, and specifically how to maintain habits during stressful life transitions.', category: 'lifestyle' },
  { title: 'SimProblem: Sustainable meal planning for busy families on a realistic budget', description: 'Create a practical weekly meal planning framework that balances nutrition, cost, environmental impact, and time constraints. Target a family of 4 with two working parents, $150/week grocery budget, and max 30 minutes prep on weeknights.', category: 'lifestyle' },
];

// ── Solution text generators ─────────────────────────────────────────────────

function generateSolution(botIndex: number, problemTitle: string, _problemDesc: string): string {
  const topic = problemTitle.replace(/^SimProblem:\s*/i, '') || 'this challenge';
  const { model } = getLlmModel(botIndex);
  const style = botIndex % 5;
  const seed = crypto.randomBytes(6).toString('hex');

  if (style === 0) {
    // Analytical framework
    return `[${model}] Analytical framework for ${topic}.\n\n` +
      `To address this systematically, we need to decompose the problem into its core dimensions: feasibility, scalability, impact, and sustainability. ` +
      `The primary constraint here is resource allocation under uncertainty — we cannot optimize all dimensions simultaneously.\n\n` +
      `Phase 1 — Establish Baselines: Before proposing solutions, we need to quantify the current state. What metrics define success? ` +
      `Without measurable baselines, any intervention is guesswork. I recommend identifying 3-5 key performance indicators that directly map to the desired outcome.\n\n` +
      `Phase 2 — Identify Leverage Points: Through sensitivity analysis, determine which factors have the highest marginal impact. ` +
      `Pareto analysis typically reveals that 20% of inputs drive 80% of outcomes. Focus initial effort here.\n\n` +
      `Phase 3 — Iterative Implementation: Start with a controlled pilot targeting the highest-leverage factor. ` +
      `Define success criteria upfront, run for a fixed period, measure against baselines, then decide whether to scale, iterate, or pivot.\n\n` +
      `Key tradeoff: thoroughness vs speed of implementation. In most real-world scenarios, a 70% solution deployed quickly outperforms ` +
      `a 95% solution that takes three times as long to ship. The feedback loop from real-world data is more valuable than theoretical optimization.\n\n` +
      `Risk mitigation: allocate 15% contingency for unexpected complexity. ` +
      `Document assumptions explicitly so they can be challenged as new information emerges. [${seed}]`;
  } else if (style === 1) {
    // Practical step-by-step
    return `[${model}] Practical implementation plan for ${topic}.\n\n` +
      `Here's a concrete, actionable plan that can be executed by a small team within realistic constraints:\n\n` +
      `Step 1 — Audit the Current State (Week 1-2): Map existing processes, identify all stakeholders, and document pain points. ` +
      `Interview at least 5 people directly affected by the problem. Their insights will reveal constraints that aren't obvious from the outside.\n\n` +
      `Step 2 — Define Success Criteria (Week 2): Establish 3-5 measurable KPIs. ` +
      `Good KPIs are specific, measurable within a month, and directly linked to the problem statement. Avoid vanity metrics.\n\n` +
      `Step 3 — Build Minimum Viable Solution (Week 3-6): Address the single highest-impact pain point first. ` +
      `Resist the urge to solve everything at once. A focused solution that works is infinitely more valuable than a comprehensive one that doesn't ship.\n\n` +
      `Step 4 — Test with a Small Cohort (Week 7-8): Deploy to 10-20% of the target population. ` +
      `Gather both quantitative metrics and qualitative feedback. The qualitative data often reveals issues metrics miss.\n\n` +
      `Step 5 — Iterate and Expand (Week 9+): Based on test results, refine the solution before full rollout. ` +
      `Plan for at least two iteration cycles — the first version is never the final one.\n\n` +
      `Critical success factors: executive buy-in secured early, dedicated owner for the initiative, ` +
      `weekly check-ins with stakeholders, and willingness to kill the project if metrics don't improve after two iterations. [${seed}]`;
  } else if (style === 2) {
    // Cross-disciplinary creative
    return `[${model}] Cross-disciplinary synthesis for ${topic}.\n\n` +
      `The most interesting solutions often come from applying frameworks from unrelated domains. Let me draw on three different fields:\n\n` +
      `From Ecology — Natural systems solve resource allocation problems through distributed intelligence. ` +
      `Ant colonies don't have central planners, yet they find optimal food sources through stigmergy (environmental signaling). ` +
      `The parallel here: instead of top-down optimization, create feedback loops where good outcomes naturally attract more resources.\n\n` +
      `From Behavioral Economics — People don't make decisions rationally. Nudge theory suggests that ` +
      `the easiest path should be the best path. Rather than trying to change behavior through education or incentives, ` +
      `redesign the choice architecture so the right decision requires the least effort.\n\n` +
      `From Immune Systems — The human immune system handles threats through layered defense: ` +
      `innate immunity handles common cases automatically, adaptive immunity learns from novel threats. ` +
      `Apply this pattern: automate routine cases, escalate edge cases to human judgment, ` +
      `and build institutional memory from each resolution.\n\n` +
      `The synthesis: create a system that (a) distributes decision-making rather than centralizing it, ` +
      `(b) makes good outcomes the path of least resistance, and (c) learns from both successes and failures ` +
      `to continuously improve. The unexpected benefit is that this approach builds organizational knowledge as a byproduct. [${seed}]`;
  } else if (style === 3) {
    // Evidence-based
    return `[${model}] Evidence-based analysis of ${topic}.\n\n` +
      `Let me ground this in what the research actually shows, rather than relying on conventional wisdom:\n\n` +
      `The evidence base: Multiple meta-analyses suggest that the most effective interventions share three characteristics — ` +
      `they're simple enough to implement without specialized training, they provide immediate feedback on outcomes, ` +
      `and they're designed to work even when motivation is low.\n\n` +
      `What doesn't work: Complex multi-step programs with deferred feedback consistently underperform in real-world conditions. ` +
      `The gap between controlled studies and field deployment is often 40-60% in effectiveness. ` +
      `This isn't because the interventions are wrong — it's because implementation fidelity drops dramatically outside research settings.\n\n` +
      `What does work: Interventions that change defaults, reduce friction, and leverage existing routines ` +
      `show the most robust results across contexts. The key insight is that behavior change is mostly an engineering problem, not a motivation problem.\n\n` +
      `My recommendation: Design for the worst case (low motivation, high stress, limited time) rather than the best case. ` +
      `If it works when conditions are bad, it'll definitely work when conditions are good. ` +
      `Start with the lowest-effort, highest-impact change and iterate from there.\n\n` +
      `Limitations: Most evidence comes from Western, educated populations. Generalizability to other contexts should be tested, not assumed. [${seed}]`;
  } else {
    // Contrarian perspective
    return `[${model}] Contrarian perspective on ${topic}.\n\n` +
      `Before proposing solutions, let me challenge the premise: are we solving the right problem? ` +
      `Often the most impactful move isn't optimizing the current approach — it's questioning whether the current approach should exist at all.\n\n` +
      `The conventional wisdom here has three blind spots:\n\n` +
      `Blind spot 1 — Survivorship bias: We study successful examples and extract patterns, ` +
      `but we rarely study the failures that followed the exact same patterns. ` +
      `What looks like a best practice might just be a common practice that happened to coincide with success.\n\n` +
      `Blind spot 2 — Complexity creep: Every "improvement" adds complexity, and complexity has compounding costs ` +
      `that aren't visible in short-term metrics. Sometimes the best solution is to remove complexity rather than add new features.\n\n` +
      `Blind spot 3 — Misaligned incentives: The people designing the solution often benefit from it being complex. ` +
      `Consultants, tool vendors, and specialists all have structural incentives to complicate things. ` +
      `Ask: who benefits from the current level of complexity?\n\n` +
      `My unconventional recommendation: Before adding anything, try removing. Identify the simplest possible version ` +
      `that still solves the core problem. Test that first. Only add complexity when simple provably fails — ` +
      `and define "provably" upfront so you can't rationalize complexity after the fact.\n\n` +
      `This approach is uncomfortable because it feels like doing less. But doing less of the right thing ` +
      `consistently beats doing more of everything inconsistently. [${seed}]`;
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
      const { model, version } = getLlmModel(bot.index);
      return {
        solution_text: generateSolution(bot.index, title, desc),
        llm_model: model,
        llm_model_version: version,
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
  const taskCounts: Record<string, number> = { flag: 0, solve: 0, vote: 0, create: 0, skip: 0, error: 0 };
  let lastRoundTypes: string[] = [];

  for (let round = 1; round <= MAX_ROUNDS; round++) {
    console.log(`\n[${timestamp()}] ── Round ${round}/${MAX_ROUNDS} ──`);
    const ordered = shuffle(bots);
    const roundTypes: string[] = [];

    for (const bot of ordered) {
      // GET task
      const getRes = await apiCall('GET', '/tasks/next?brief=true&instruct=none&categories=slim', bot.apiKey);
      totalRequests++;

      if (getRes.status === 204) {
        taskCounts.skip++;
        continue;
      }

      if (getRes.status !== 200) {
        console.log(`  [${timestamp()}] ${bot.name}: GET /tasks/next → ${getRes.status}`);
        taskCounts.error++;
        await sleep(1000);
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

      if (postRes.status >= 400) {
        taskCounts.error++;
      } else {
        taskCounts[task.taskType] = (taskCounts[task.taskType] || 0) + 1;
        roundTypes.push(task.taskType);
      }

      await sleep(200);
    }

    lastRoundTypes = roundTypes;

    // Progress check every 3 rounds
    if (round % 3 === 0) {
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

      // Detect dominant phase
      const typeCounts: Record<string, number> = {};
      for (const t of lastRoundTypes) typeCounts[t] = (typeCounts[t] || 0) + 1;
      const dominant = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
      const phase = dominant ? `${dominant[0].toUpperCase()}-HEAVY` : 'IDLE';

      console.log(`\n  ── Progress (Round ${round}) — Phase: ${phase} ──`);
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

    await sleep(3000);
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

  // ── Model Arena ──
  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║                        MODEL ARENA                                 ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

  const modelStats = await sql`
    SELECT
      m.model_name,
      m.total_solutions,
      m.avg_bt_score,
      m.total_wins,
      m.total_comparisons,
      CASE WHEN m.total_comparisons > 0 THEN ROUND(m.total_wins::numeric / m.total_comparisons * 100, 1) ELSE 0 END AS win_rate
    FROM llm_models m
    ORDER BY m.avg_bt_score DESC
  `;

  if (modelStats.length > 0) {
    console.log('  Model               | Sols | Avg BT | Win Rate | Wins/Comps');
    console.log('  --------------------|------|--------|----------|------------');
    for (const m of modelStats) {
      console.log(`  ${String(m.model_name).padEnd(19)} | ${String(m.total_solutions).padStart(4)} | ${String(Number(m.avg_bt_score).toFixed(0)).padStart(6)} | ${String(m.win_rate).padStart(7)}% | ${m.total_wins}/${m.total_comparisons}`);
    }
  } else {
    console.log('  No model data yet.');
  }

  // ── Category Distribution ──
  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║                     CATEGORY DISTRIBUTION                          ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

  const catStats = await sql`
    SELECT category, COUNT(*)::int AS cnt
    FROM problems
    WHERE category IS NOT NULL
    GROUP BY category
    ORDER BY cnt DESC
  `;

  for (const c of catStats) {
    console.log(`  ${String(c.category).padEnd(20)} ${c.cnt} problems`);
  }

  // ── Task Type Distribution ──
  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║                    TASK TYPE DISTRIBUTION                           ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

  const taskStats = await sql`
    SELECT task_type, COUNT(*)::int AS cnt
    FROM tasks
    GROUP BY task_type
    ORDER BY cnt DESC
  `;

  for (const t of taskStats) {
    console.log(`  ${String(t.task_type).padEnd(10)} ${t.cnt} tasks`);
  }

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
  console.log(`  Max rounds: ${MAX_ROUNDS} | 200ms inter-bot | 3s inter-round`);
  await runSimulation(bots, sql);

  console.log('\n=== Phase 3: Final Report ===');
  await generateReport(sql);

  await sql.end();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
