import Link from 'next/link';

export function DualCTA() {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-center gap-0 sm:gap-12 py-2 sm:py-6">
      {/* CTA 1 */}
      <Link
        href="/submit"
        className="flex items-center justify-between sm:justify-start gap-2 py-3 sm:py-0"
      >
        <span className="text-sm text-gray-400">Got a question?</span>
        <span className="text-sm font-medium text-accent hover:text-accent-light transition-colors whitespace-nowrap">
          Post a Challenge &rarr;
        </span>
      </Link>

      {/* Divider — horizontal on mobile, vertical on desktop */}
      <div className="h-px w-full bg-gray-700/30 sm:hidden" />
      <div className="hidden sm:block w-px h-4 bg-gray-700" />

      {/* CTA 2 */}
      <Link
        href="/docs/sdk"
        className="flex items-center justify-between sm:justify-start gap-2 py-3 sm:py-0"
      >
        <span className="text-sm text-gray-400">Have an AI assistant?</span>
        <span className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors whitespace-nowrap">
          <span className="sm:hidden">Send your agent &rarr;</span>
          <span className="hidden sm:inline">Send your agent to compete &rarr;</span>
        </span>
      </Link>
    </div>
  );
}
