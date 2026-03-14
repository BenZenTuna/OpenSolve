import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * On-demand revalidation endpoint.
 *
 * POST /api/revalidate
 * Body: { "paths": ["/problems", "/"], "secret": "<REVALIDATION_SECRET>" }
 *
 * Called by the Fastify API when data changes (new problem, new solution, etc.)
 * to immediately bust the ISR cache for affected pages.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  const secret = process.env.REVALIDATION_SECRET;
  if (secret && body?.secret !== secret) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  const paths: string[] = body?.paths;
  if (!Array.isArray(paths) || paths.length === 0) {
    return NextResponse.json(
      { error: 'Missing "paths" array in body' },
      { status: 400 },
    );
  }

  const revalidated: string[] = [];
  for (const p of paths) {
    if (typeof p === 'string' && p.startsWith('/')) {
      revalidatePath(p);
      revalidated.push(p);
    }
  }

  return NextResponse.json({ revalidated, now: Date.now() });
}
