import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import type { AuthUser, UserRole, UserDetails } from '@/types/database.types';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  userRole: UserRole | null;
  userDetails: UserDetails | null;
  isAdmin: boolean;
  isFloorStaff: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Get role from user_details table
  const userRole = userDetails?.role || null;
  const isAdmin = userRole === 'admin';
  const isFloorStaff = userRole === 'floor_staff';

  const fetchUserDetails = async (userId: string): Promise<UserDetails | null> => {
    try {
      // Create a race between the query and a timeout
      const queryPromise = (async () => {
        const { data, error } = await supabase
          .from('user_details')
          .select('*')
          .eq('id', userId);
        return { data, error };
      })();

      const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) =>
        setTimeout(() => {
          resolve({ data: null, error: { message: 'Query timeout' } });
        }, 8000)
      );

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

      if (error) {
        console.error('Error fetching user details:', error);
        return null;
      }

      // No error, but also no data (user hasn't been set up in user_details table yet)
      if (!data || (Array.isArray(data) && data.length === 0)) {
        return null;
      }

      const userDetails = Array.isArray(data) ? data[0] : data;
      return userDetails as UserDetails;
    } catch (error) {
      console.error('Error fetching user details:', error);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!isMounted) return;

      // INITIAL_SESSION fires when Supabase restores the persisted session from localStorage
      // This is the event we rely on for page load restoration. We skip SIGNED_IN
      // because it fires before the client is fully initialized, causing slow queries.
      if (event === 'INITIAL_SESSION') {
        if (currentSession?.user) {
          setSession(currentSession);
          setUser({
            id: currentSession.user.id,
            email: currentSession.user.email || '',
            user_metadata: currentSession.user.user_metadata as AuthUser['user_metadata'],
          });
          const details = await fetchUserDetails(currentSession.user.id);
          if (isMounted) setUserDetails(details);
        }
        // Always clear loading after INITIAL_SESSION, whether or not a session was found
        if (isMounted) setLoading(false);
        return;
      }

      // SIGNED_IN fires on fresh sign-in. Skip it on page load (INITIAL_SESSION handles that).
      // Only process it if a session wasn't already restored.
      if (event === 'SIGNED_IN') {
        if (!session && currentSession?.user) {
          setSession(currentSession);
          setUser({
            id: currentSession.user.id,
            email: currentSession.user.email || '',
            user_metadata: currentSession.user.user_metadata as AuthUser['user_metadata'],
          });
          const details = await fetchUserDetails(currentSession.user.id);
          if (isMounted) {
            setUserDetails(details);
            setLoading(false);
          }
        }
        return;
      }

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setUserDetails(null);
        setLoading(false);
        return;
      }
    });

    // Fallback: if INITIAL_SESSION doesn't fire within 10 seconds, clear loading
    // (gives Supabase plenty of time to initialize and fire INITIAL_SESSION or SIGNED_IN)
    const timeoutId = setTimeout(() => {
      if (isMounted && loading) {
        setLoading(false);
      }
    }, 10000);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      // Ensures UI state clears even if the server request fails 
      // (e.g. if the refresh token is already revoked or network is down)
      setUser(null);
      setSession(null);
      setUserDetails(null);
    }
  }, []);

  const value: AuthContextType = {
    user,
    session,
    loading,
    userRole,
    userDetails,
    isAdmin,
    isFloorStaff,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
