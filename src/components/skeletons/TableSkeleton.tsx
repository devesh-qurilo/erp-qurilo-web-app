import Skeleton from "@/components/Skeleton";

export default function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="mt-4 space-y-3">
      {/* Header */}
      <div className="grid grid-cols-6 gap-4 mb-2">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>

      {/* Rows */}
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="grid grid-cols-6 gap-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}