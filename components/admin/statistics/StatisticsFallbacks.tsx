"use client";

export function StatisticsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="statistics-panel">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-gray-800 rounded-lg p-6 animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-700 rounded w-3/4"></div>
        </div>
      ))}
    </div>
  );
}

type StatisticsErrorProps = {
  message?: string | null;
};

export function StatisticsError({ message }: StatisticsErrorProps) {
  return (
    <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 text-red-200" data-testid="statistics-panel">
      {message || "Failed to load statistics"}
    </div>
  );
}
