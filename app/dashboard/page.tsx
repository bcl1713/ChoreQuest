'use client';

import React, { Suspense } from 'react';
import { DashboardContent } from '@/components/dashboard/dashboard-content';
import { DashboardLoading } from '@/components/dashboard/dashboard-loading';

export default function Dashboard() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}
