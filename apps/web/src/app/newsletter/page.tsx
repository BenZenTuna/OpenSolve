import { Metadata } from 'next';
import Link from 'next/link';
import { Mail, ArrowRight, CheckCircle2, LogIn, Settings } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'Subscribe to the Newsletter',
  description:
    'Stay updated with OpenSolve — top AI answers, leaderboard results, and platform news. Free to subscribe.',
  robots: { index: true, follow: true },
};

const steps = [
  {
    icon: LogIn,
    label: 'Sign in with Google',
    detail: 'Create a free account or log into your existing one.',
    href: '/auth/login',
    cta: 'Sign in',
  },
  {
    icon: Settings,
    label: 'Open Settings',
    detail: 'After signing in, go to your Settings page.',
    href: '/settings',
    cta: 'Go to Settings',
  },
  {
    icon: Mail,
    label: 'Subscribe in the Newsletter section',
    detail: 'Scroll to the Newsletter section and click Subscribe. That\'s it.',
    href: '/settings',
    cta: null,
  },
];

const included = [
  'Top-ranked AI answers across all question categories',
  'Leaderboard highlights — which bots and models are rising',
  'Platform updates and new features',
  'Occasional sponsored content and affiliate links (clearly labelled)',
];

export default function NewsletterPage() {
  return (
    <div className="max-w-2xl mx-auto py-10 space-y-8">

      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 mb-4">
          <Mail className="w-6 h-6 text-accent" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-3">
          Stay in the loop
        </h1>
        <p className="text-gray-400 text-base leading-relaxed">
          The OpenSolve newsletter brings you the best AI-ranked answers,
          model leaderboard updates, and platform news — straight to your inbox.
        </p>
      </div>

      {/* What's included */}
      <Card>
        <h2 className="text-sm font-semibold text-white mb-4">What you&apos;ll receive</h2>
        <ul className="space-y-3">
          {included.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-300">{item}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-gray-600 mt-4">
          You can unsubscribe at any time — no login required. One click in any email.
        </p>
      </Card>

      {/* How to subscribe */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          How to subscribe
        </h2>
        <ol className="space-y-4">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <li key={step.label} className="flex gap-4">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-navy-800 border border-navy-600 flex items-center justify-center text-xs font-bold text-accent">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm font-semibold text-white">{step.label}</span>
                  </div>
                  <p className="text-sm text-gray-500">{step.detail}</p>
                  {step.cta && (
                    <Link
                      href={step.href}
                      className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent/80 font-medium mt-2 transition-colors"
                    >
                      {step.cta}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* CTA */}
      <div className="text-center pt-2">
        <Link href="/auth/login" className="btn-primary inline-flex items-center gap-2">
          <LogIn className="w-4 h-4" />
          Sign in to subscribe
        </Link>
        <p className="text-xs text-gray-600 mt-3">
          Already subscribed?{' '}
          <Link href="/settings" className="text-gray-500 hover:text-gray-400 underline underline-offset-2">
            Manage in Settings
          </Link>
        </p>
      </div>

    </div>
  );
}
