import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isPasswordRecovery: boolean;
  clearPasswordRecovery: () => void;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<string | null>;
  forceRefreshSession: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function detectRecoveryFromUrl(): boolean {
  const hash = window.location.hash;
  if (hash.includes('type=recovery')) return true;
  const params = new URLSearchParams(window.location.search);
  if (params.get('view') === 'reset-password') return true;
  // When redirectTo is /reset-password, the path itself signals recovery
  if (window.location.pathname === '/reset-password') return true;
  return false;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(detectRecoveryFromUrl);
  const recoveryRef = useRef(isPasswordRecovery);

  useEffect(() => {
    recoveryRef.current = isPasswordRecovery;
  }, [isPasswordRecovery]);

  const clearPasswordRecovery = useCallback(() => {
    setIsPasswordRecovery(false);
  }, []);

  const isRefreshingRef = useRef(false);
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);

  const refreshSession = useCallback(async (): Promise<string | null> => {
    const currentSession = await supabase.auth.getSession().then(r => r.data.session);
    if (currentSession) {
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = currentSession.expires_at;
      if (expiresAt && expiresAt > 0 && expiresAt - now > 60) {
        return currentSession.access_token;
      }
    }

    if (isRefreshingRef.current && refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    isRefreshingRef.current = true;
    refreshPromiseRef.current = supabase.auth.refreshSession().then(({ data: { session: newSession }, error }) => {
      if (!error && newSession) {
        setSession(newSession);
        setUser(newSession.user);
        return newSession.access_token;
      }
      return null;
    }).finally(() => {
      isRefreshingRef.current = false;
      refreshPromiseRef.current = null;
    });

    return refreshPromiseRef.current;
  }, []);

  const forceRefreshSession = useCallback(async (): Promise<string | null> => {
    const { data: { session: newSession }, error } = await supabase.auth.refreshSession();
    if (!error && newSession) {
      setSession(newSession);
      setUser(newSession.user);
      return newSession.access_token;
    }
    return null;
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (event === 'PASSWORD_RECOVERY') {
          setIsPasswordRecovery(true);
        } else if (event === 'USER_UPDATED') {
          if (recoveryRef.current) {
            setIsPasswordRecovery(false);
          }
        } else if (event === 'SIGNED_OUT') {
          setIsPasswordRecovery(false);
        }
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      })();
    });


    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const refreshInterval = setInterval(async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession) {
        const expiresAt = currentSession.expires_at;
        const now = Math.floor(Date.now() / 1000);
        if (expiresAt && expiresAt > 0 && (expiresAt - now) < 300) {
          await refreshSession();
        }
      }
    }, 60000);

    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      supabase.rpc('log_user_login', {
        p_ip_address: null,
        p_user_agent: navigator.userAgent,
      }).catch(() => {});
    }
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isPasswordRecovery, clearPasswordRecovery, signUp, signIn, signOut, refreshSession, forceRefreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
