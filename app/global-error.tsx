"use client";

import { useEffect } from "react";
import { AppErrorFallback } from "@/components/AppErrorFallback";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global App Router error boundary caught an error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <AppErrorFallback actionLabel="Try again" onAction={reset} />
      </body>
    </html>
  );
}
