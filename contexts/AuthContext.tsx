// contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
// Importa o cliente Supabase do nosso novo arquivo centralizado
import { supabase } from '../utils/supabaseClient';
import type { User } from '@supabase/supabase-js';
import { AuthContextType, PlanType } from '../types';
import { PLANS } from '../constants/plans';

type AppUser = User | null;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser>(null);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<PlanType>('pro');

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserPlan(session.user.id);
      }

      setLoading(false);
    }

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserPlan(session.user.id);
      } else {
        setUserPlan('pro');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const fetchUserPlan = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('plan')
        .eq('user_id', userId)
        .single();

      if (data && data.plan) {
        if (['starter', 'online', 'pro'].includes(data.plan)) {
          setUserPlan(data.plan as PlanType);
        } else {
          setUserPlan('pro');
        }
      } else {
        // Default to pro (trial) if no plan settings found
        setUserPlan('pro');
      }
    } catch (err) {
      console.error('Error fetching plan:', err);
      setUserPlan('pro');
    }
  };

  const signIn = async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: pass,
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUserPlan('pro');
  };

  const checkAccess = (feature: keyof typeof PLANS['pro']['features']) => {
    const planFeatures = PLANS[userPlan].features;
    return planFeatures[feature];
  };

  const value = {
    user,
    userPlan,
    checkAccess,
    signIn,
    signOut,
    refreshUserPlan: async () => {
      if (user) await fetchUserPlan(user.id);
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
