import { db } from '../config/database.js';
import { users, bots, problems } from './schema.js';

async function seed() {
  console.log('Seeding database...');

  // Create a test user
  const [testUser] = await db.insert(users).values({
    username: 'admin',
    oauthProvider: 'google',
    oauthId: 'seed-admin-001',
    role: 'admin',
    onboardingComplete: true,
  }).returning();
  console.log('Created test user:', testUser.id);

  // Create test bots with known API keys
  const botProfiles = [
    {
      name: 'SeedBot Alpha',
      description: 'A reference bot for development and testing',
      apiKey: 'os_bot_test1234567890abcdef1234567890abcdef12345678',
      globalElo: 1450,
    },
    {
      name: 'DeepSolve AI',
      description: 'Deep reasoning engine specializing in complex multi-step problems',
      apiKey: 'os_bot_deep2234567890abcdef1234567890abcdef12345678',
      globalElo: 1380,
    },
    {
      name: 'LogicBot v2',
      description: 'Formal logic and structured analysis bot',
      apiKey: 'os_bot_logi3234567890abcdef1234567890abcdef12345678',
      globalElo: 1320,
    },
    {
      name: 'NeuralSolve',
      description: 'Neural network-powered creative problem solver',
      apiKey: 'os_bot_neur4234567890abcdef1234567890abcdef12345678',
      globalElo: 1280,
    },
  ];

  for (const profile of botProfiles) {
    const [bot] = await db.insert(bots).values({
      ownerId: testUser.id,
      name: profile.name,
      description: profile.description,
      globalElo: profile.globalElo,
    }).returning();
    console.log(`Created bot: ${profile.name} (${bot.id})`);
    console.log(`  API key: ${profile.apiKey}`);
  }

  // Create some test problems
  const testProblems = [
    {
      authorType: 'human' as const,
      humanAuthorId: testUser.id,
      title: 'How can cities reduce food waste by 50% within 5 years?',
      description: 'Urban food waste is a major environmental and economic issue. Propose a comprehensive strategy that could halve food waste in a mid-size city (500k-2M population) within five years, considering supply chain, retail, household, and composting/recycling stages.',
      status: 'active' as const,
      greenFlags: 3,
    },
    {
      authorType: 'human' as const,
      humanAuthorId: testUser.id,
      title: 'Design a system to verify news articles for accuracy in real-time',
      description: 'Misinformation spreads faster than corrections. Propose a practical system that could evaluate the factual accuracy of news articles as they are published, considering scalability, bias detection, source verification, and user trust.',
      status: 'active' as const,
      greenFlags: 3,
    },
    {
      authorType: 'human' as const,
      humanAuthorId: testUser.id,
      title: 'What is the best approach to make remote education as effective as in-person?',
      description: 'Remote learning has shown significant gaps compared to in-person education, especially for younger students. Propose a solution that addresses engagement, social development, hands-on learning, and equitable access.',
      status: 'pending' as const,
    },
  ];

  for (const p of testProblems) {
    const [problem] = await db.insert(problems).values(p).returning();
    console.log(`Created problem: "${problem.title}" (${problem.status})`);
  }

  console.log('\nSeed complete!');
  console.log('---');
  console.log('Test user: admin (seed-admin-001)');
  console.log('Bots:');
  for (const profile of botProfiles) {
    console.log(`  ${profile.name}`);
  }
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
