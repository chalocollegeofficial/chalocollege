
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  // Removed useToast hook call to prevent "Invalid Hook Call" errors and unnecessary re-renders.
  // We import 'toast' directly above.

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleSession = useCallback(async (currentSession) => {
    try {
      const currentUser = currentSession?.user ?? null;
      const adminStatus = !!currentUser;

      setSession(currentSession);
      setUser(currentUser);
      setIsAdmin(adminStatus);
      
    } catch (error) {
      console.error("Critical error in session handling:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Error getting initial session:", error);
        setLoading(false);
      } else {
        handleSession(session);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, [handleSession]);

  const signUp = useCallback(async (email, password, options) => {
    try {
      const { error } = await supabase.auth.signUp({ email, password, options });
      if (error) {
        toast({
          variant: "destructive",
          title: "Sign up Failed",
          description: error.message || "Something went wrong",
        });
        throw error;
      }
      return { error: null };
    } catch (err) {
      return { error: err };
    }
  }, []);

  const signIn = useCallback(async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({
          variant: "destructive",
          title: "Sign in Failed",
          description: error.message || "Something went wrong",
        });
        throw error;
      }
      return { data, error: null };
    } catch (err) {
      return { error: err };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          variant: "destructive",
          title: "Sign out Failed",
          description: error.message || "Something went wrong",
        });
        throw error;
      }
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      return { error: null };
    } catch (err) {
      return { error: err };
    }
  }, []);

  const value = useMemo(() => ({
    user,
    session,
    isAdmin,
    loading,
    signUp,
    signIn,
    signOut
  }), [user, session, isAdmin, loading, signUp, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
