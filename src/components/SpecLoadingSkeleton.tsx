import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const SpecLoadingSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse" role="status" aria-label="Loading specification">
      {/* Header Skeleton */}
      <Card className="p-8 bg-gradient-card backdrop-blur-xl border-border/20 rounded-fluid">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <Skeleton className="w-5 h-5 rounded-full" />
          </div>

          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </Card>

      {/* Content Skeleton */}
      <Card className="p-8 bg-gradient-card backdrop-blur-xl border-border/20 rounded-fluid space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
        </div>

        <div className="space-y-4">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        <div className="space-y-4">
          <Skeleton className="h-6 w-2/3" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      </Card>

      {/* Tech Stack Skeleton */}
      <Card className="p-6 bg-gradient-card backdrop-blur-xl border-border/20 rounded-fluid">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
          <Skeleton className="w-5 h-5" />
        </div>

        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="w-12 h-12 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <span className="sr-only">Loading your specification...</span>
    </div>
  );
};

export const AgentPanelSkeleton = () => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-3" role="status" aria-label="Loading agents">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <Card key={i} className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </Card>
      ))}
      <span className="sr-only">Loading expert panel...</span>
    </div>
  );
};
