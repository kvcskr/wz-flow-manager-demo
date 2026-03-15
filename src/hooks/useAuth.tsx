import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

type UserRole = 'superadmin' | 'admin' | 'kierowca' | null;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: UserRole;
  orgId: string | null;
  loading: boolean;
  subscriptionBlocked: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  role: null,
  orgId: null,
  loading: true,
  subscriptionBlocked: false,
  signOut: async () => {},
});

const META_CACHE_KEY = 'wz_user_meta';

function loadCachedMeta(userId: string) {
  try {
    const raw = localStorage.getItem(META_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.userId === userId) return parsed as { userId: string; role: UserRole; orgId: string };
  } catch { /* ignore */ }
  return null;
}

function saveCachedMeta(userId: string, role: UserRole, orgId: string | null) {
  try {
    localStorage.setItem(META_CACHE_KEY, JSON.stringify({ userId, role, orgId }));
  } catch { /* ignore */ }
}

function clearCachedMeta() {
  try { localStorage.removeItem(META_CACHE_KEY); } catch { /* ignore */ }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionBlocked, setSubscriptionBlocked] = useState(false);
  // Zapobiega ponownemu fetchowi metadanych gdy ta sama karta jest już zalogowana
  // Naprawia: otwieranie nowej karty powoduje zdarzenia auth w oryginalnej karcie
  const fetchedForUserIdRef = useRef<string | null>(null);

  const fetchUserMeta = async (userId: string, attempt = 0): Promise<void> => {
    try {
      const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 12000));
      const query = supabase
        .from('uzytkownicy_organizacji')
        .select('rola, org_id')
        .eq('user_id', userId)
        .single()
        .then(({ data }) => data);
      const data = await Promise.race([query, timeout]);
      if (data) {
        saveCachedMeta(userId, data.rola as UserRole, data.org_id);
        setRole(data.rola as UserRole);
        setOrgId(data.org_id);
        if (data.rola !== 'superadmin' && data.org_id) {
          checkSubscription(data.org_id);
        }
      } else if (attempt < 2) {
        await new Promise(r => setTimeout(r, 500));
        return fetchUserMeta(userId, attempt + 1);
      } else {
        setRole(null);
        setOrgId(null);
      }
    } catch {
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 500));
        return fetchUserMeta(userId, attempt + 1);
      }
      setRole(null);
      setOrgId(null);
    }
  };

  const checkSubscription = async (orgIdToCheck: string) => {
    try {
      const { data } = await supabase
        .from('organizacje')
        .select('subscription_status, subscription_expires_at')
        .eq('id', orgIdToCheck)
        .single();
      if (data) {
        const isInactive = data.subscription_status === 'inactive';
        const isExpired = data.subscription_expires_at &&
          new Date(data.subscription_expires_at) < new Date();
        setSubscriptionBlocked(isInactive || !!isExpired);
      }
    } catch {
      setSubscriptionBlocked(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // TOKEN_REFRESHED: tylko zaktualizuj token, nie pobieraj danych usera ponownie
        // To był główny powód konfliktów przy dwóch otwartych kartach
        if (event === 'TOKEN_REFRESHED') {
          setSession(session);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          if (session.user.id !== fetchedForUserIdRef.current) {
            fetchedForUserIdRef.current = session.user.id;
            // Załaduj z cache natychmiast (F5 działa bez czekania na Supabase)
            const cached = loadCachedMeta(session.user.id);
            if (cached) {
              setRole(cached.role);
              setOrgId(cached.orgId);
              setLoading(false);
              // Zweryfikuj w tle — zaktualizuj jeśli dane się zmieniły
              fetchUserMeta(session.user.id);
            } else {
              // Brak cache — czekaj na Supabase (pierwsze logowanie)
              await fetchUserMeta(session.user.id);
              setLoading(false);
            }
          } else {
            setLoading(false);
          }
        } else {
          fetchedForUserIdRef.current = null;
          clearCachedMeta();
          setRole(null);
          setOrgId(null);
          setSubscriptionBlocked(false);
          setLoading(false);
        }
      }
    );

    // Gdy karta wraca z nieaktywności — odśwież sesję cicho, bez pełnego reload
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession) {
          setSession(currentSession);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setRole(null);
    setOrgId(null);
    setSubscriptionBlocked(false);
  };

  return (
    <AuthContext.Provider value={{ session, user, role, orgId, loading, subscriptionBlocked, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
