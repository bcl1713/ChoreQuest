"use client";

import React, { useEffect, useRef, useState } from "react";
import { RealtimeUpdateEffect } from "@/components/animations";

type StatCardProps = {
  icon: React.ReactNode;
  label: string;
  value: number | null;
  testId: string;
};

export function StatCard({ icon, label, value, testId }: StatCardProps) {
  const [showFlash, setShowFlash] = useState(false);
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (prevValueRef.current !== null && prevValueRef.current !== value) {
      setShowFlash(true);
      const timer = setTimeout(() => setShowFlash(false), 600);
      return () => clearTimeout(timer);
    }
    prevValueRef.current = value;
  }, [value]);

  return (
    <div className="fantasy-card p-3 sm:p-6 text-center relative">
      <RealtimeUpdateEffect type="flash" active={showFlash} color="#fbbf24" />
      <div
        className="text-xl sm:text-3xl gold-text mb-1 sm:mb-2 flex items-center justify-center gap-1"
        data-testid={testId}
      >
        {icon}
        {value}
      </div>
      <div className="text-xs sm:text-sm text-gray-400">{label}</div>
    </div>
  );
}
