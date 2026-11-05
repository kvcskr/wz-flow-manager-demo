import { useAuth } from './useAuth';

export function useSubscriptionCheck() {
  const { subscriptionBlocked, loading } = useAuth();
  return { blocked: subscriptionBlocked, checking: loading };
}
