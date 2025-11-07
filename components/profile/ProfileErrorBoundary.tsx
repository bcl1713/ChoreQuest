'use client';

import { Component, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// Wrapper component to use hooks in error boundary
function ErrorBoundaryContent({ error, onReset }: { error: Error | null; onReset: () => void }) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center p-6">
      <div className="fantasy-card p-8 max-w-md w-full">
        <div className="flex justify-center mb-4">
          <div className="bg-red-900/30 rounded-full p-3">
            <AlertCircle size={32} className="text-red-400" />
          </div>
        </div>
        <h1 className="text-2xl font-fantasy text-gold-400 mb-4 text-center">
          Something went wrong
        </h1>
        <p className="text-gray-300 mb-6 text-center">
          An error occurred while loading your profile settings.
        </p>
        {error && (
          <div className="bg-dark-800/50 border border-red-500/30 rounded-lg p-3 mb-6">
            <p className="text-red-300 text-sm font-mono">{error.message}</p>
          </div>
        )}
        <div className="flex flex-col gap-3">
          <button
            onClick={onReset}
            className="btn btn-primary w-full"
          >
            Try Again
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn btn-secondary w-full"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default class ProfileErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error('ProfileErrorBoundary caught error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorBoundaryContent error={this.state.error} onReset={this.resetError} />
      );
    }

    return this.props.children;
  }
}
