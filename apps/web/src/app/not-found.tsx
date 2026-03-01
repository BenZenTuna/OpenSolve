import Link from 'next/link';
import { ArrowLeft, SearchX } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card padding="lg" className="text-center max-w-md">
        <SearchX className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h2 className="text-xl font-display font-bold text-white mb-2">
          Page Not Found
        </h2>
        <p className="text-gray-400 mb-6">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link href="/" className="btn-primary inline-flex">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </Card>
    </div>
  );
}
