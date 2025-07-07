'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isRefreshing: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isRefreshing: false,
  refreshUser: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshUser = async () => {
    // Prevent concurrent refresh calls
    if (isRefreshing) {
      console.log('User refresh already in progress, skipping...');
      return;
    }

    try {
      setIsRefreshing(true);
      console.log('Refreshing user...');
      const currentUser = await getCurrentUser();
      
      // Only update state if user data has actually changed
      setUser(prevUser => {
        if (JSON.stringify(prevUser) === JSON.stringify(currentUser)) {
          console.log('User data unchanged, skipping state update');
          return prevUser;
        }
        console.log('User refreshed:', currentUser ? 'Success' : 'No user');
        return currentUser;
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Add timeout safety net (5 seconds maximum for faster UX)
        const timeoutId = setTimeout(() => {
          console.warn('Auth initialization timeout - setting loading to false');
          setIsLoading(false);
          setIsRefreshing(false);
        }, 5000);

        // Wait for Supabase session to be ready
        const { data: { session }, error } = await supabase.auth.getSession();
        
        clearTimeout(timeoutId);
        
        if (error) {
          console.error('Session error:', error);
          setUser(null);
          setIsLoading(false);
          setIsRefreshing(false);
          return;
        }

        if (session) {
          // Session exists, now safely get user profile
          await refreshUser();
        } else {
          // No session, user is not authenticated
          setUser(null);
          setIsLoading(false);
          setIsRefreshing(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
        setIsLoading(false);
        setIsRefreshing(false);
      }
    };

    // Initialize auth
    initializeAuth();

    // Set up auth state change listener with debouncing
    let authTimeout: NodeJS.Timeout | null = null;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event);
        
        // Clear any pending auth processing
        if (authTimeout) {
          clearTimeout(authTimeout);
        }
        
        if (event === 'SIGNED_IN') {
          // Only handle SIGNED_IN events, not TOKEN_REFRESHED to prevent loops
          if (session && !isRefreshing) {
            // Debounce auth state changes by 500ms
            authTimeout = setTimeout(async () => {
              await refreshUser();
            }, 500);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsRefreshing(false);
          setIsLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      if (authTimeout) {
        clearTimeout(authTimeout);
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isRefreshing, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}