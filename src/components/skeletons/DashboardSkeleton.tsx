import Skeleton from "@/components/Skeleton";

export default function DashboardSkeleton() {
  return (
    <div className="max-w-screen-xl p-6 space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-60" />
        <Skeleton className="h-6 w-32" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">

          {/* Profile */}
          <div className="flex items-center gap-6 border p-6 rounded-lg bg-white">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-52" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>

          {/* Tasks Table */}
          <div className="border p-4 rounded-lg bg-white">
            <Skeleton className="h-6 w-32 mb-4" />

            {[...Array(5)].map((_, i) => (
              <div key={i} className="grid grid-cols-4 gap-4 mb-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-4">

          {/* Summary */}
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border p-4 rounded-lg bg-white">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-6 w-10 mb-1" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>

          {/* Timelog */}
          <div className="border p-4 rounded-lg bg-white space-y-4">
            <Skeleton className="h-5 w-40" />

            <div className="flex gap-2 justify-center">
              {[...Array(7)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-10 rounded-full" />
              ))}
            </div>

            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </div>

      {/* Appreciations */}
      <div className="border p-4 rounded-lg bg-white">
        <Skeleton className="h-6 w-40 mb-4" />

        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-4 mb-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-60" />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border p-6 rounded-lg bg-white">
            <Skeleton className="h-5 w-32 mb-4" />

            {[...Array(2)].map((_, j) => (
              <div key={j} className="flex gap-3 mb-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}