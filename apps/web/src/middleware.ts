import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'os_access_gate';
const COOKIE_VALUE = 'granted';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

/** Fire-and-forget page view tracking — no personal data, non-blocking */
function trackPageView(pathname: string) {
  // API_URL already includes /api/v1 in production (e.g. http://api:4000/api/v1)
  const base = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  fetch(`${base}/track/pageview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: pathname }),
  }).catch(() => {});
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow social media crawlers through the access gate so OG metadata is readable
  const userAgent = request.headers.get('user-agent') || '';
  const isCrawler = /facebookexternalhit|Twitterbot|LinkedInBot|WhatsApp|Slackbot|Discordbot|TelegramBot|Googlebot|bingbot/i.test(userAgent);
  if (isCrawler) {
    return NextResponse.next();
  }

  // Only track real browser page navigations, not internal Next.js requests
  // RSC requests (rsc: 1) = React Server Component data fetches (multiple per page load)
  // Prefetch requests = link prefetching for future navigations
  // Real page loads have accept: text/html and no RSC/prefetch headers
  const isInternalRequest = request.headers.get('rsc') === '1'
    || request.headers.get('next-router-prefetch') === '1'
    || request.headers.get('purpose') === 'prefetch'
    || request.headers.get('x-middleware-prefetch') === '1';

  // Admin routes bypass access gate and are not tracked
  if (pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const secret = process.env.ACCESS_GATE_SECRET;

  // Gate disabled if no secret configured
  if (!secret) {
    if (!isInternalRequest) trackPageView(pathname);
    return NextResponse.next();
  }

  const { searchParams } = request.nextUrl;
  const accessParam = searchParams.get('access');

  // Handle logout — clear cookie and redirect to /
  if (accessParam === 'logout') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.delete('access');
    const response = NextResponse.redirect(url);
    response.cookies.set(COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    return response;
  }

  // Handle access grant — set cookie and redirect without query param
  if (accessParam === secret) {
    const url = request.nextUrl.clone();
    url.searchParams.delete('access');
    const response = NextResponse.redirect(url);
    response.cookies.set(COOKIE_NAME, COOKIE_VALUE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    });
    return response;
  }

  // Allow through if valid cookie exists
  if (request.cookies.get(COOKIE_NAME)?.value === COOKIE_VALUE) {
    if (!isInternalRequest) trackPageView(pathname);
    return NextResponse.next();
  }

  // Paths exempt from access gate:
  // - /coming-soon: prevent infinite rewrite loop
  // - /privacy, /terms, /impressum: legal pages must always be accessible
  // - /newsletter/confirm: double opt-in confirmation linked from emails
  // - /unsubscribe: one-click unsubscribe (must be ungated per UWG §7)
  const exemptPaths = ['/coming-soon', '/privacy', '/terms', '/impressum', '/contact', '/newsletter/confirm', '/unsubscribe'];
  if (exemptPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // No valid access — rewrite to coming-soon (URL stays the same for the visitor)
  const url = request.nextUrl.clone();
  url.pathname = '/coming-soon';
  url.search = '';
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico
     * - api/ routes (bot API must remain accessible via rewrite proxy)
     * - static file extensions
     */
    '/((?!_next/static|_next/image|favicon\\.ico|api/|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|css|js)$).*)',
  ],
};
