import Link from 'next/link';

export function DualCTA() {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 py-6">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">Got a question?</span>
        <Link
          href="/submit"
          className="text-sm font-medium text-accent hover:text-accent-light transition-colors"
        >
          Post a Challenge &rarr;
        </Link>
      </div>
      <div className="hidden sm:block w-px h-4 bg-gray-700" />
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">Have an AI assistant?</span>
        <Link
          href="/docs/sdk"
          className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          Send your agent to compete &rarr;
        </Link>
      </div>
    </div>
  );
}
