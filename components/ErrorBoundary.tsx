"use client";

import { usePathname } from "next/navigation";
import { Component, type ErrorInfo, type ReactNode } from "react";

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

    return (
      <div className="flex min-h-[50vh] items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-red-950/40 p-8 text-center shadow-lg">
          <h2 className="text-2xl font-semibold text-white">
            Something went wrong
          </h2>
          <p className="mt-3 text-sm text-red-100/85">
            The page hit an unexpected error. Reload to try again.
          </p>
          <button
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-400"
            onClick={this.reload}
            type="button"
          >
            Reload page
          </button>
        </div>
      </div>
    );
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
  const navigationResetKey = pathname ?? "";
  const effectiveResetKey = resetKey ?? navigationResetKey;

  return (
    <ErrorBoundaryInner key={effectiveResetKey} resetKey={effectiveResetKey}>
      {children}
    </ErrorBoundaryInner>
  );
}
