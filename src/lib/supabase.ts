import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.\n' +
    'Required variables:\n' +
    '  - VITE_SUPABASE_URL\n' +
    '  - VITE_SUPABASE_ANON_KEY\n\n' +
    'Copy .env.example to .env and fill in your Supabase credentials.'
  );
}

export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window === 'undefined') return null;
      const item = window.localStorage.getItem(key);
      if (!item) return null;
      // Test if it's parseable JSON. If not, this throws an error.
      JSON.parse(item);
      return item;
    } catch (e) {
      console.warn('Invalid auth token found in storage, clearing it.', e);
      if (typeof window !== 'undefined') window.localStorage.removeItem(key);
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (typeof window !== 'undefined') window.localStorage.removeItem(key);
  },
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: safeStorage,
  },
});

/**
 * Get the current user's role from their metadata
 */
export const getUserRole = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.user_metadata?.user_role || null;
};

/**
 * Check if the current user is a floor staff member
 */
export const isFloorStaff = async (): Promise<boolean> => {
  const role = await getUserRole();
  return role === 'floor_staff';
};

/**
 * Subscribe to real-time changes in the late_comings table
 */
export const subscribeToLateComings = (
  callback: (payload: any) => void
) => {
  return supabase
    .channel('late_comings_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'late_comings',
      },
      callback
    )
    .subscribe();
};
