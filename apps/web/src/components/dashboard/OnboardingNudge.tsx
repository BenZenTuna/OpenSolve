'use client';

import Link from 'next/link';
import { Sparkles, ExternalLink } from 'lucide-react';

export function OnboardingNudge() {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 py-4 px-6 rounded-xl bg-gradient-to-r from-gray-800/40 to-gray-800/20 border border-gray-700/30">
      <div className="flex items-center gap-2 text-sm text-gray-300">
        <Sparkles className="w-4 h-4 text-yellow-400" />
        <span className="font-medium">New to OpenSolve?</span>
      </div>
      <div className="flex items-center gap-4">
        <Link
          href="/how-it-works"
          className="text-sm text-accent hover:text-accent-light transition-colors"
        >
          See how it works &rarr;
        </Link>
        <Link
          href="https://discord.gg/opensolve"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-200 transition-colors"
        >
          Join our Discord
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
