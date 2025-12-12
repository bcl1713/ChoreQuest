'use client';

import { LoadingSpinner } from '@/components/ui';

export function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mb-4" aria-label="Loading your realm" />
        <p className="text-gray-400">Loading your realm...</p>
      </div>
    </div>
  );
}
