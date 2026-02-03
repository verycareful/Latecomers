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

  // Fetch user details from database
  const fetchUserDetails = async (userId: string) => {
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
    // Check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        if (currentSession?.user) {
          setSession(currentSession);
          setUser({
            id: currentSession.user.id,
            email: currentSession.user.email || '',
            user_metadata: currentSession.user.user_metadata as AuthUser['user_metadata'],
          });

          // Fetch role from user_details table (don't block on error)
          fetchUserDetails(currentSession.user.id).then(details => {
            setUserDetails(details);
          });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      }
      setLoading(false);
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        if (currentSession?.user) {
          setSession(currentSession);
          setUser({
            id: currentSession.user.id,
            email: currentSession.user.email || '',
            user_metadata: currentSession.user.user_metadata as AuthUser['user_metadata'],
          });

          // Fetch role from user_details table
          fetchUserDetails(currentSession.user.id).then(details => {
            setUserDetails(details);
          });
        } else {
          setSession(null);
          setUser(null);
          setUserDetails(null);
        }
      }
    );

    return () => {
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
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserDetails(null);
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
