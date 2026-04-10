import { Skeleton } from "@/components/ui";

export default function DashboardLoading() {
  return (
    <div className="space-y-10">
      {/* Header skeleton */}
      <div className="flex justify-between items-end">
        <div className="space-y-3">
          <Skeleton variant="bar" className="h-8 w-64" />
          <Skeleton variant="bar" className="h-4 w-48" />
        </div>
        <Skeleton variant="bar" className="h-10 w-36 rounded-lg" />
      </div>

      {/* Quick stats row skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton variant="card" className="h-24 rounded-xl" />
        <Skeleton variant="card" className="h-24 rounded-xl" />
        <Skeleton variant="card" className="h-24 rounded-xl" />
      </div>

      {/* Section header skeleton */}
      <div>
        <Skeleton variant="bar" className="h-6 w-40 mb-6" />
      </div>

      {/* Job cards grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton variant="card" className="h-48 rounded-xl" />
        <Skeleton variant="card" className="h-48 rounded-xl" />
        <Skeleton variant="card" className="h-48 rounded-xl" />
        <Skeleton variant="card" className="h-48 rounded-xl" />
      </div>
    </div>
  );
}
