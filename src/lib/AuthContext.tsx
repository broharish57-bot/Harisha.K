import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStoredToken, getStoredUser, setStoredSession, clearStoredSession, apiRequest } from './api.ts';
import { clearOfflineStorageOnLogout } from './offlineQueue.ts';

export interface UserSession {
  id: string;
  phone: string;
  email?: string;
  full_name: string;
  role: 'patient' | 'doctor' | 'health_worker' | 'admin' | 'doctor_admin';
  preferred_language: 'kn' | 'hi' | 'en';
  village_or_town: string;
  district: string;
  state: string;
  is_verified: boolean;
  emergency_contact_phone?: string;
  doctor_details?: any;
  health_worker_details?: any;
}

interface AuthContextType {
  user: UserSession | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: UserSession) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
  refreshUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    const currentToken = getStoredToken();
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await apiRequest<{ user: UserSession }>('/api/auth/me');
      if (data && data.user) {
        setUser(data.user);
        setStoredSession(currentToken, data.user);
      }
    } catch (err) {
      console.warn('Session refresh error:', err);
      // If token expired, clear
      clearStoredSession();
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = (newToken: string, newUser: UserSession) => {
    setToken(newToken);
    setUser(newUser);
    setStoredSession(newToken, newUser);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    clearStoredSession();
    clearOfflineStorageOnLogout();
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
