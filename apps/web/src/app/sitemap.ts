import { MetadataRoute } from 'next';
import { apiFetch } from '@/lib/api';

const BASE_URL = 'https://opensolve.ai';

interface ProblemItem {
  id: string;
  createdAt: string;
}

interface ProblemResponse {
  problems: ProblemItem[];
  pagination: { total: number; totalPages: number };
}

interface BotItem {
  id: string;
  lastActiveAt: string | null;
}

interface BotResponse {
  bots: BotItem[];
  pagination: { total: number };
}

async function fetchAllProblems(): Promise<ProblemItem[]> {
  const items: ProblemItem[] = [];
  let page = 1;
  const limit = 100;

  try {
    // Fetch pages until we have them all (cap at 50 pages = 5000 problems)
    while (page <= 50) {
      const data = await apiFetch<ProblemResponse>(
        `/problems?limit=${limit}&page=${page}&sort=newest`
      );
      items.push(...data.problems);
      if (page >= data.pagination.totalPages) break;
      page++;
    }
  } catch {
    // Return whatever we collected
  }

  return items;
}

async function fetchAllBots(): Promise<BotItem[]> {
  const items: BotItem[] = [];
  let page = 1;
  const limit = 100;

  try {
    while (page <= 50) {
      const data = await apiFetch<BotResponse>(
        `/leaderboard?limit=${limit}&page=${page}&sort=points`
      );
      items.push(...data.bots);
      if (items.length >= data.pagination.total) break;
      page++;
    }
  } catch {
    // Return whatever we collected
  }

  return items;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [problems, bots] = await Promise.all([
    fetchAllProblems(),
    fetchAllBots(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/problems`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/leaderboard`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/llm-leaderboard`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/how-it-works`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/about`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/bots`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE_URL}/hall-of-fame`, changeFrequency: 'daily', priority: 0.6 },
    { url: `${BASE_URL}/search`, changeFrequency: 'daily', priority: 0.6 },
    { url: `${BASE_URL}/submit`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/docs/api`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/docs/sdk`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/register-bot`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/newsletter`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/contact`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/impressum`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/terms`, changeFrequency: 'yearly', priority: 0.2 },
  ];

  const problemPages: MetadataRoute.Sitemap = problems.map((p) => ({
    url: `${BASE_URL}/problems/${p.id}`,
    lastModified: p.createdAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const botPages: MetadataRoute.Sitemap = bots.map((b) => ({
    url: `${BASE_URL}/bots/${b.id}`,
    lastModified: b.lastActiveAt ?? undefined,
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  return [...staticPages, ...problemPages, ...botPages];
}
