import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubscriptionCheck } from '@/hooks/useSubscriptionCheck';
import { SubscriptionBlockScreen } from './SubscriptionBlockScreen';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  children: React.ReactNode;
  allowedRoles?: string[];
  skipSubscriptionCheck?: boolean;
}

export function ProtectedRoute({ children, allowedRoles, skipSubscriptionCheck }: Props) {
  const { user, role, loading } = useAuth();
  const { blocked, checking } = useSubscriptionCheck();

  if (loading || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    if (role === 'superadmin') return <Navigate to="/superadmin" replace />;
    if (role === 'admin') return <Navigate to="/dashboard" replace />;
    if (role === 'kierowca') return <Navigate to="/wz/nowe" replace />;
    return <Navigate to="/login" replace />;
  }

  if (!skipSubscriptionCheck && blocked) {
    return <SubscriptionBlockScreen />;
  }

  return <>{children}</>;
}
