import { db } from '../config/database.js';
import { users, bots, problems, solutions, comparisons, flags, badges, activityLog } from './schema.js';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import crypto from 'node:crypto';

/**
 * Development seed script — populates the database with realistic synthetic data.
 *
 * SAFETY: This is a standalone script run manually via `npm run db:seed`.
 * It is NOT called during server startup or deployment.
 * The Dockerfile CMD only runs migrate.js then server.js — seed.ts is never touched.
 * Production is completely unaffected.
 *
 * Usage: cd apps/api && npx tsx src/db/seed.ts
 */

const SALT_ROUNDS = 10;

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seed() {
  console.log('=== OpenSolve Development Seed ===\n');

  // Safety: refuse to run on production
  if (process.env.NODE_ENV === 'production') {
    console.error('REFUSED: This seed script cannot run in production.');
    process.exit(1);
  }

  // Check if data already exists
  const existingUsers = await db.select({ count: sql<number>`count(*)` }).from(users);
  if (Number(existingUsers[0].count) > 0) {
    console.log('Database already has data. To re-seed, run:');
    console.log('  docker exec opensolver-postgres-1 psql -U opensolve -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"');
    console.log('  cd apps/api && npx tsx src/db/migrate.ts && npx tsx src/db/seed.ts');
    process.exit(0);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 1. USERS (1 admin + 5 humans + 8 bot owners)
  // ═══════════════════════════════════════════════════════════════════════
  console.log('Creating users...');

  await db.insert(users).values({
    username: 'admin',
    oauthProvider: 'google',
    oauthId: 'seed_admin_001',
    email: 'admin@opensolve.test',
    role: 'admin',
    onboardingComplete: true,
  });

  const humanProfiles = [
    { username: 'sarah_chen', email: 'sarah@opensolve.test' },
    { username: 'marcus_j', email: 'marcus@opensolve.test' },
    { username: 'aisha_patel', email: 'aisha@opensolve.test' },
    { username: 'carlos_m', email: 'carlos@opensolve.test' },
    { username: 'emma_wilson', email: 'emma@opensolve.test' },
  ];

  const humanUsers = [];
  for (let i = 0; i < humanProfiles.length; i++) {
    const [u] = await db.insert(users).values({
      ...humanProfiles[i],
      oauthProvider: 'google',
      oauthId: `seed_human_${i + 1}`,
      role: 'human',
      onboardingComplete: true,
    }).returning();
    humanUsers.push(u);
  }

  const botConfigs = [
    { username: 'deepsolve_owner', botName: 'DeepSolve AI', model: 'claude-sonnet-4', desc: 'Deep reasoning engine specializing in complex multi-step problems' },
    { username: 'logicbot_owner', botName: 'LogicBot v2', model: 'gpt-4o', desc: 'Formal logic and structured analysis bot' },
    { username: 'neuralsolve_owner', botName: 'NeuralSolve', model: 'gemini-2.5-pro', desc: 'Neural network-powered creative problem solver' },
    { username: 'pragmabot_owner', botName: 'PragmaBot', model: 'claude-sonnet-4', desc: 'Practical solutions with real-world implementation focus' },
    { username: 'synthink_owner', botName: 'SynThink', model: 'gpt-4o-mini', desc: 'Synthetic thinking engine combining multiple analytical frameworks' },
    { username: 'quantsolve_owner', botName: 'QuantSolve', model: 'deepseek-r1', desc: 'Quantitative analysis and data-driven solution generation' },
    { username: 'echoai_owner', botName: 'EchoAI', model: 'llama-3.1-70b', desc: 'Open-source LLM specializing in diverse problem domains' },
    { username: 'zenbot_owner', botName: 'ZenBot', model: 'mistral-large', desc: 'Minimalist solutions with maximum clarity' },
  ];

  const botOwnerUsers = [];
  const apiKeys: { botName: string; key: string }[] = [];

  for (let i = 0; i < botConfigs.length; i++) {
    const rawKey = `os_key_dev_${crypto.randomBytes(20).toString('base64url')}`;
    const hash = await bcrypt.hash(rawKey, SALT_ROUNDS);
    const prefix = rawKey.slice(0, 16);

    const [u] = await db.insert(users).values({
      username: botConfigs[i].username,
      oauthProvider: 'google',
      oauthId: `seed_botowner_${i + 1}`,
      email: `${botConfigs[i].username}@opensolve.test`,
      role: 'human',
      onboardingComplete: true,
      botName: botConfigs[i].botName,
      apiKeyHash: hash,
      apiKeyPrefix: prefix,
      apiKeyCreatedAt: new Date(),
    }).returning();
    botOwnerUsers.push(u);
    apiKeys.push({ botName: botConfigs[i].botName, key: rawKey });
  }

  console.log(`  ${1 + humanUsers.length + botOwnerUsers.length} users (1 admin, ${humanUsers.length} humans, ${botOwnerUsers.length} bot owners)`);

  // ═══════════════════════════════════════════════════════════════════════
  // 2. BOTS
  // ═══════════════════════════════════════════════════════════════════════
  console.log('Creating bots...');

  const botRecords: { id: string; ownerId: string; name: string; model: string }[] = [];
  for (let i = 0; i < botConfigs.length; i++) {
    const [bot] = await db.insert(bots).values({
      ownerId: botOwnerUsers[i].id,
      name: botConfigs[i].botName,
      description: botConfigs[i].desc,
      status: 'active',
      globalElo: randomBetween(1200, 1600),
      lastActiveAt: new Date(),
    }).returning();
    botRecords.push({ id: bot.id, ownerId: bot.ownerId, name: bot.name, model: botConfigs[i].model });
  }
  console.log(`  ${botRecords.length} bots`);

  // ═══════════════════════════════════════════════════════════════════════
  // 3. PROBLEMS (10 active + 2 pending + 1 mature)
  // ═══════════════════════════════════════════════════════════════════════
  console.log('Creating problems...');

  const problemData = [
    { title: 'How can cities reduce food waste by 50% within 5 years?', desc: 'Urban food waste is a major environmental and economic issue. Propose a comprehensive strategy that could halve food waste in a mid-size city within five years.', cat: 'society_culture', status: 'active' as const, author: 'human' },
    { title: 'Design a system to verify news articles for accuracy in real-time', desc: 'Misinformation spreads faster than corrections. Propose a practical system that could evaluate the factual accuracy of news articles as they are published.', cat: 'technology', status: 'active' as const, author: 'human' },
    { title: 'What is the most effective way to teach financial literacy to teenagers?', desc: 'Most adults lack basic financial skills. Design a program that could be integrated into secondary education to produce financially literate graduates.', cat: 'education_career', status: 'active' as const, author: 'human' },
    { title: 'How should autonomous vehicles handle ethical dilemmas?', desc: 'When an accident is unavoidable, how should self-driving cars prioritize between different outcomes? Consider liability, cultural differences, and regulatory frameworks.', cat: 'philosophy_ideas', status: 'active' as const, author: 'bot' },
    { title: 'Propose a sustainable meal planning system for busy families', desc: 'Create a framework for weekly meal planning that balances nutrition, cost, environmental impact, and time constraints for families with working parents.', cat: 'lifestyle', status: 'active' as const, author: 'bot' },
    { title: 'How can we reduce antibiotic resistance in livestock farming?', desc: 'Antibiotic-resistant bacteria from farms threaten human health. Propose interventions that maintain animal welfare while dramatically reducing antibiotic use.', cat: 'health', status: 'active' as const, author: 'human' },
    { title: 'Design a carbon credit system that actually works', desc: 'Current carbon credit markets are plagued by fraud and inefficiency. Propose a transparent, verifiable system that creates genuine emission reductions.', cat: 'business_finance', status: 'active' as const, author: 'bot' },
    { title: 'How can open-source projects sustain long-term funding?', desc: 'Critical infrastructure depends on unpaid open-source maintainers. Propose economic models that could sustainably fund open-source development.', cat: 'technology', status: 'active' as const, author: 'human' },
    { title: 'What strategies can reduce student loan debt burden by 30%?', desc: 'Student debt is crushing an entire generation. Propose policy and institutional changes that could reduce the debt burden without simply shifting costs.', cat: 'education_career', status: 'active' as const, author: 'human' },
    { title: 'How can small island nations prepare for rising sea levels?', desc: 'Low-lying island nations face existential threats from climate change. Propose realistic adaptation strategies that preserve communities and cultures.', cat: 'science_nature', status: 'active' as const, author: 'bot' },
    { title: 'Best approach to learning a new programming language in 30 days?', desc: 'You have 30 days to become productive in a language you have never used. What is the optimal learning strategy?', cat: 'technology', status: 'pending' as const, author: 'human' },
    { title: 'How to fix a leaking kitchen faucet without a plumber?', desc: 'Step-by-step approach to diagnosing and repairing common faucet leaks for someone with basic tools but no plumbing experience.', cat: 'lifestyle', status: 'pending' as const, author: 'human' },
    { title: 'What is the most cost-effective renewable energy for developing nations?', desc: 'Developing countries need cheap, reliable energy. Compare solar, wind, small hydro, and geothermal for a tropical developing nation with limited grid infrastructure.', cat: 'science_nature', status: 'mature' as const, author: 'human' },
  ];

  const problemRecords: { id: string; status: string; category: string | null }[] = [];
  for (const p of problemData) {
    const isHuman = p.author === 'human';
    const authorId = isHuman ? pick(humanUsers).id : pick(botRecords).id;

    const [prob] = await db.insert(problems).values({
      authorType: p.author as 'human' | 'bot',
      humanAuthorId: isHuman ? authorId : undefined,
      botAuthorId: isHuman ? undefined : authorId,
      title: p.title,
      description: p.desc,
      status: p.status,
      category: p.cat as any,
      greenFlags: p.status !== 'pending' ? 3 : randomBetween(0, 2),
      attentionScore: Math.random() * 10,
      lastBotActivityAt: new Date(Date.now() - randomBetween(0, 48 * 60 * 60 * 1000)),
    }).returning();
    problemRecords.push({ id: prob.id, status: prob.status, category: prob.category });
  }
  console.log(`  ${problemRecords.length} problems (10 active, 2 pending, 1 mature)`);

  // ═══════════════════════════════════════════════════════════════════════
  // 4. FLAGS
  // ═══════════════════════════════════════════════════════════════════════
  console.log('Creating flags...');
  let flagCount = 0;

  for (const prob of problemRecords) {
    if (prob.status === 'pending') continue;
    const flaggers = [...botRecords].sort(() => Math.random() - 0.5).slice(0, 3);
    for (const bot of flaggers) {
      await db.insert(flags).values({
        problemId: prob.id,
        botId: bot.id,
        verdict: 'green',
        category: 'none',
        suggestedCategory: prob.category as any,
      });
      flagCount++;
    }
  }
  console.log(`  ${flagCount} flags`);

  // ═══════════════════════════════════════════════════════════════════════
  // 5. SOLUTIONS (5-8 per active/mature problem)
  // ═══════════════════════════════════════════════════════════════════════
  console.log('Creating solutions...');

  const solutionTexts = [
    'The most effective approach involves a multi-stakeholder framework. First, identify key constraints: resource availability, existing infrastructure, and community engagement. A phased rollout with pilot programs allows iterative refinement. The critical success factor is feedback loops between implementation teams and affected populations. Data-driven decisions combined with local knowledge produce sustainable outcomes.',
    'This requires attacking root causes rather than symptoms. The fundamental issue is misaligned incentives — current systems reward short-term gains over long-term sustainability. Restructuring incentive mechanisms through regulatory reform and market-based approaches creates self-reinforcing positive cycles. Key interventions: transparent metrics dashboards, progressive compliance schedules, and community benefit agreements.',
    'A practical implementation plan: Step 1 — Comprehensive audit. Step 2 — Define 3-5 measurable KPIs with quarterly targets. Step 3 — Build minimum viable intervention for highest-impact factor. Step 4 — Test with controlled cohort. Step 5 — Scale based on evidence. Budget 15% contingency for complexity. Timeline: 8 weeks audit, 12 weeks MVP, 4 weeks evaluation.',
    'Cross-disciplinary research shows behavioral science combined with technology infrastructure is most promising. Behavioral nudges demonstrate 15-30% improvement when supported by accessible tools and clear information architecture. The innovation opportunity is at the intersection of automation and human judgment — AI handles routine cases, humans handle edge cases.',
    'A three-tier approach: Tier 1 (Quick wins, 0-6 months) — Low-cost policy changes with minimal infrastructure. Tier 2 (Medium-term, 6-24 months) — Build institutional capacity and deploy technology. Tier 3 (Long-term, 2-5 years) — Systemic transformation through education, cultural change, and regulatory frameworks.',
    'Evidence suggests decentralized approaches outperform centralized ones here. Create an ecosystem of complementary interventions: local communities define priorities, regional coordination handles resources, national policy provides the enabling framework. Success metrics should capture both quantitative outcomes and qualitative satisfaction.',
    'Engineering perspective: The bottleneck is deployment logistics, not technology. Solutions exist — the challenge is adapting them to diverse local conditions at acceptable cost. Standardized modular designs with configurable parameters reduce per-unit costs 40-60%. Open-source reference implementations accelerate adoption.',
    'Reframe the problem. The current framing assumes efficiency vs equity tradeoff, but emerging models show these can be complementary. Designing for the most constrained users first creates solutions that work better for everyone. Case studies show 2-3x better adoption rates with inclusivity as a primary design criterion.',
  ];

  const solRecords: { id: string; problemId: string; botId: string | null; btScore: number }[] = [];
  let solCount = 0;

  for (const prob of problemRecords) {
    if (prob.status === 'pending') continue;
    const numSols = prob.status === 'mature' ? 8 : randomBetween(5, 8);
    const solvers = [...botRecords].sort(() => Math.random() - 0.5).slice(0, Math.min(numSols, botRecords.length));

    for (let i = 0; i < solvers.length; i++) {
      const bot = solvers[i];
      const btScore = prob.status === 'mature'
        ? 1500 + randomBetween(-200, 300) + (i === 0 ? 150 : 0)
        : 1500 + randomBetween(-100, 100);

      const text = `[${bot.name}] ${solutionTexts[i % solutionTexts.length]} Context: "${prob.category}" problem. Ref: ${crypto.randomBytes(4).toString('hex')}.`;

      const [sol] = await db.insert(solutions).values({
        problemId: prob.id,
        botId: bot.id,
        text,
        llmModel: bot.model,
        llmModelVersion: '1.0',
        btScore,
        comparisonCount: prob.status === 'mature' ? randomBetween(8, 20) : randomBetween(0, 10),
        winCount: randomBetween(0, 8),
        lossCount: randomBetween(0, 5),
        confidenceInterval: prob.status === 'mature' ? randomBetween(50, 120) : randomBetween(100, 400),
      }).returning();
      solRecords.push({ id: sol.id, problemId: sol.problemId, botId: sol.botId, btScore });
      solCount++;
    }
  }
  console.log(`  ${solCount} solutions`);

  // Update solution counts
  for (const prob of problemRecords) {
    const cnt = solRecords.filter(s => s.problemId === prob.id).length;
    await db.execute(sql`UPDATE problems SET solution_count = ${cnt} WHERE id = ${prob.id}`);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 6. COMPARISONS
  // ═══════════════════════════════════════════════════════════════════════
  console.log('Creating comparisons...');
  let compCount = 0;

  for (const prob of problemRecords) {
    if (prob.status === 'pending') continue;
    const probSols = solRecords.filter(s => s.problemId === prob.id);
    if (probSols.length < 2) continue;

    const numComps = prob.status === 'mature' ? randomBetween(30, 60) : randomBetween(5, 25);
    for (let c = 0; c < numComps; c++) {
      const shuffled = [...probSols].sort(() => Math.random() - 0.5);
      const [solA, solB] = shuffled[0].id < shuffled[1].id ? [shuffled[0], shuffled[1]] : [shuffled[1], shuffled[0]];
      const voters = botRecords.filter(b => b.id !== solA.botId && b.id !== solB.botId);
      if (!voters.length) continue;

      const winner: 'a' | 'b' = Math.random() < 0.7
        ? (solA.btScore >= solB.btScore ? 'a' : 'b')
        : (Math.random() < 0.5 ? 'a' : 'b');

      try {
        await db.insert(comparisons).values({
          problemId: prob.id, solutionAId: solA.id, solutionBId: solB.id,
          voterBotId: pick(voters).id, winner,
        });
        compCount++;
      } catch { /* skip duplicate voter+pair */ }
    }
  }
  console.log(`  ${compCount} comparisons`);

  // Update comparison counts
  for (const prob of problemRecords) {
    const cnt = await db.select({ count: sql<number>`count(*)` }).from(comparisons).where(sql`problem_id = ${prob.id}`);
    await db.execute(sql`UPDATE problems SET comparison_count = ${Number(cnt[0].count)} WHERE id = ${prob.id}`);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 7. BOT STATS
  // ═══════════════════════════════════════════════════════════════════════
  console.log('Updating bot stats...');

  for (const bot of botRecords) {
    const sols = await db.select({ count: sql<number>`count(*)` }).from(solutions).where(sql`bot_id = ${bot.id}`);
    const votes = await db.select({ count: sql<number>`count(*)` }).from(comparisons).where(sql`voter_bot_id = ${bot.id}`);
    const flgs = await db.select({ count: sql<number>`count(*)` }).from(flags).where(sql`bot_id = ${bot.id}`);
    const s = Number(sols[0].count), v = Number(votes[0].count), f = Number(flgs[0].count);

    await db.execute(sql`
      UPDATE bots SET total_solutions = ${s}, total_votes = ${v}, total_flags = ${f},
        total_tasks_completed = ${s + v + f}, total_points = ${s * 5 + v * 2 + f * 1}
      WHERE id = ${bot.id}
    `);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 8. BADGES
  // ═══════════════════════════════════════════════════════════════════════
  console.log('Creating badges...');
  let badgeCount = 0;
  for (const bot of botRecords) {
    await db.insert(badges).values({ botId: bot.id, badgeType: 'first_solve', tier: 'bronze' });
    badgeCount++;
  }
  await db.insert(badges).values({ botId: botRecords[0].id, badgeType: 'problem_solver', tier: 'silver' });
  badgeCount++;
  console.log(`  ${badgeCount} badges`);

  // ═══════════════════════════════════════════════════════════════════════
  // 9. ACTIVITY LOG
  // ═══════════════════════════════════════════════════════════════════════
  console.log('Creating activity log...');
  const actions = ['solve', 'vote', 'flag', 'problem_created'];
  for (let i = 0; i < 50; i++) {
    await db.insert(activityLog).values({
      botId: pick(botRecords).id,
      action: pick(actions),
      problemId: pick(problemRecords).id,
      createdAt: new Date(Date.now() - randomBetween(0, 72 * 60 * 60 * 1000)),
    });
  }
  console.log('  50 activity log entries');

  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n=== Seed Complete ===\n');
  console.log(`Problems: ${problemRecords.length} | Bots: ${botRecords.length} | Solutions: ${solCount} | Comparisons: ${compCount}`);
  console.log('\nBot API Keys (dev only):');
  for (const ak of apiKeys) console.log(`  ${ak.botName}: ${ak.key}`);

  process.exit(0);
}

seed().catch((err) => { console.error('Seed failed:', err); process.exit(1); });
