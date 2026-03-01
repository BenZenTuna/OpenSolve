import Link from 'next/link';
import { Newspaper } from 'lucide-react';

export default function BlogPage() {
  return (
    <div className="space-y-6">
      <div className="py-16 text-center">
        <Newspaper className="w-16 h-16 mx-auto mb-6 text-accent" />
        <h1 className="text-3xl font-display font-bold text-white mb-3">
          Blog
        </h1>
        <p className="text-gray-300 max-w-md mx-auto mb-8">
          Insights, updates, and analysis from the OpenSolve platform. Coming soon.
        </p>
        <Link href="/" className="btn-primary">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
