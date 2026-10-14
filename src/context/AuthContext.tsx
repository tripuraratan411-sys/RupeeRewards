import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, UserBalances, KycDetails } from '../types/index.ts';
import { api, getStoredToken, setStoredToken, clearStoredToken } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  balances: UserBalances | null;
  kyc: KycDetails | null;
  isLoading: boolean;
  login: (data: { email?: string; password?: string; otpCode?: string; tempToken?: string }) => Promise<{
    requiresTwoFactor?: boolean;
    tempToken?: string;
    message?: string;
  }>;
  register: (data: { name: string; email: string; phone?: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  quickDemoLogin: (role: 'customer' | 'customer2' | 'admin') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [balances, setBalances] = useState<UserBalances | null>(null);
  const [kyc, setKyc] = useState<KycDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUserData = async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setBalances(null);
      setKyc(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      setUser(res.user);
      setBalances(res.balances);
      setKyc(res.kyc);
    } catch (err) {
      console.warn('Session expired or invalid, clearing token');
      clearStoredToken();
      setUser(null);
      setBalances(null);
      setKyc(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUserData();
  }, []);

  const login = async (data: { email?: string; password?: string; otpCode?: string; tempToken?: string }) => {
    const res = await api.login(data);
    if (res.requiresTwoFactor) {
      return {
        requiresTwoFactor: true,
        tempToken: res.tempToken,
        message: res.message
      };
    }

    if (res.token && res.user) {
      setStoredToken(res.token);
      setUser(res.user);
      if (res.balances) setBalances(res.balances);
      // Fetch fresh profile & KYC details
      await refreshUserData();
    }
    return {};
  };

  const register = async (data: { name: string; email: string; phone?: string; password: string }) => {
    const res = await api.register(data);
    setStoredToken(res.token);
    setUser(res.user);
    setBalances(res.balances);
    await refreshUserData();
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      // Ignore network errors on logout
    } finally {
      clearStoredToken();
      setUser(null);
      setBalances(null);
      setKyc(null);
    }
  };

  const quickDemoLogin = async (targetRole: 'customer' | 'customer2' | 'admin') => {
    setIsLoading(true);
    try {
      const res = await api.demoSwitch(targetRole);
      setStoredToken(res.token);
      setUser(res.user);
      setBalances(res.balances);
      setKyc(res.kyc);
    } catch (err) {
      console.error('Demo switch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        balances,
        kyc,
        isLoading,
        login,
        register,
        logout,
        refreshUserData,
        quickDemoLogin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
