'use client';

import { useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Crown } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { Button } from '@/components/ui';

// Error Boundary Component
class AdminErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Admin Dashboard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center">
          <div className="fantasy-card p-8 max-w-md text-center">
            <h2 className="text-2xl font-fantasy text-red-400 mb-4">⚠️ Error</h2>
            <p className="text-gray-300 mb-4">
              Something went wrong loading the admin dashboard.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              {this.state.error?.message || 'Unknown error'}
            </p>
            <Button onClick={() => window.location.reload()} variant="gold" size="sm">
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function AdminPage() {
  const router = useRouter();
  const { user, profile, isLoading, family } = useAuth();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isLoading && !user) {
      router.push('/auth/login');
      return;
    }

    // Redirect to dashboard if user is not a Guild Master
    if (!isLoading && user && profile?.role !== 'GUILD_MASTER') {
      router.push('/dashboard?error=unauthorized');
    }
  }, [user, profile, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated or not authorized
  // The useEffect above handles the redirect
  if (!user || profile?.role !== 'GUILD_MASTER') {
    return null;
  }

  return (
    <AdminErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
        {/* Header */}
        <header className="border-b border-dark-600 bg-dark-800/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-fantasy text-transparent bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text font-bold flex items-center gap-2">
                  <Crown size={32} />
                  Admin Dashboard
                </h1>
                {family && (
                  <p className="text-sm text-gray-400">
                    Managing: <span className="text-gold-400">{family.name}</span>
                  </p>
                )}
              </div>
              <Button onClick={() => router.push('/dashboard')} variant="secondary" size="sm">
                ← Back to Dashboard
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {/* Admin Dashboard Component */}
          <AdminDashboard />
        </main>
      </div>
    </AdminErrorBoundary>
  );
}
