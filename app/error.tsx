"use client";

import { useEffect } from "react";
import { AppErrorFallback } from "@/components/AppErrorFallback";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App Router error boundary caught an error:", error);
  }, [error]);

  return <AppErrorFallback actionLabel="Try again" onAction={reset} />;
}
