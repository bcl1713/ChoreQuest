'use client';

import React from 'react';

type StatCardProps = {
  icon: React.ReactNode;
  label: string;
  value: number | null;
  testId: string;
};

export function StatCard({ icon, label, value, testId }: StatCardProps) {
  return (
    <div className="fantasy-card p-3 sm:p-6 text-center">
      <div className="text-xl sm:text-3xl gold-text mb-1 sm:mb-2 flex items-center justify-center gap-1" data-testid={testId}>
        {icon}
        {value}
      </div>
      <div className="text-xs sm:text-sm text-gray-400">{label}</div>
    </div>
  );
}
