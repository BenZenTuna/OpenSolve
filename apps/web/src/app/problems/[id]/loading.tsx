import { Skeleton } from '@/components/ui/Skeleton';

export default function ProblemLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back link */}
      <Skeleton className="h-4 w-32" />

      {/* Problem header */}
      <div className="glass p-8">
        <div className="flex items-center gap-3 mb-3">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-7 w-3/4 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3 mb-6" />
        <div className="flex gap-4 pt-4 border-t border-surface-border">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>

      {/* Podium skeleton */}
      <Skeleton className="h-6 w-36 mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass p-5">
            <Skeleton className="h-5 w-24 rounded-full mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6 mb-4" />
            <div className="flex justify-between pt-3 border-t border-surface-border">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
