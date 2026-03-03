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
      const { data, error } = await supabase
        .from('user_details')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user details:', error);
        return null;
      }
      return data as UserDetails;
    } catch (error) {
      console.error('Error fetching user details:', error);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Safety timeout to ensure loading state clears even if Supabase initialization is delayed or fails silently.
    const timeoutId = setTimeout(() => {
      if (isMounted && loading) setLoading(false);
    }, 5000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!isMounted) return;

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setUserDetails(null);
        setLoading(false);
        return;
      }

      if (currentSession?.user) {
        setSession(currentSession);
        setUser({
          id: currentSession.user.id,
          email: currentSession.user.email || '',
          user_metadata: currentSession.user.user_metadata as AuthUser['user_metadata'],
        });

        // Await user details, then clear loading
        const details = await fetchUserDetails(currentSession.user.id);
        if (isMounted) {
          setUserDetails(details);
          setLoading(false);
        }
      } else {
        setSession(null);
        setUser(null);
        setUserDetails(null);
        setLoading(false);
      }
    });

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
