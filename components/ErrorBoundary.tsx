"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Component, Suspense, type ErrorInfo, type ReactNode } from "react";
import { AppErrorFallback } from "@/components/AppErrorFallback";

type Props = {
  children: ReactNode;
  resetKey?: string;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

class ErrorBoundaryInner extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    if (process.env.NODE_ENV !== "production") {
      throw error;
    }

    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Root error boundary caught an error:", error, errorInfo);
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({
        hasError: false,
        error: null,
      });
    }
  }

  private readonly reload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return <AppErrorFallback onAction={this.reload} />;
  }
}

export function ErrorBoundary({
  children,
  resetKey,
}: {
  children: ReactNode;
  resetKey?: string;
}) {
  const pathname = usePathname();
  const fallbackResetKey = resetKey ?? `${pathname ?? ""}?`;

  return (
    <Suspense
      fallback={
        <ErrorBoundaryInner resetKey={fallbackResetKey}>
          {children}
        </ErrorBoundaryInner>
      }
    >
      <ErrorBoundaryWithSearchParams pathname={pathname} resetKey={resetKey}>
        {children}
      </ErrorBoundaryWithSearchParams>
    </Suspense>
  );
}

function ErrorBoundaryWithSearchParams({
  children,
  pathname,
  resetKey,
}: {
  children: ReactNode;
  pathname: string | null;
  resetKey?: string;
}) {
  const searchParams = useSearchParams();
  const navigationResetKey = `${pathname ?? ""}?${searchParams?.toString() ?? ""}`;
  const effectiveResetKey = resetKey ?? navigationResetKey;

  return (
    <ErrorBoundaryInner resetKey={effectiveResetKey}>
      {children}
    </ErrorBoundaryInner>
  );
}
