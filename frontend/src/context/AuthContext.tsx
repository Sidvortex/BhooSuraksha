import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AuthUser {
  id: number;
  username: string;
  role: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loginError: string | null;
  isLoggingIn: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getBackendUrl(): string {
  return (typeof window !== 'undefined' && (window as unknown as { ENV_BACKEND_URL?: string }).ENV_BACKEND_URL) || '';
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('auth_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const login = async (username: string, password: string): Promise<boolean> => {
    const backendUrl = getBackendUrl();
    if (!backendUrl) {
      setLoginError('No backend URL configured. Set one in Settings before logging in.');
      return false;
    }
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const response = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setLoginError(body?.detail || 'Login failed');
        return false;
      }
      const data = await response.json();
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      return true;
    } catch {
      setLoginError('Could not reach the backend. Is it running?');
      return false;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated: !!token, loginError, isLoggingIn, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
