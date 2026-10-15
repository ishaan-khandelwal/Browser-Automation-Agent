'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, logout as apiLogout, register as apiRegister, tryRefresh, getMe, clearAccessToken } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: try to restore session via refresh cookie
  useEffect(() => {
    (async () => {
      try {
        const ok = await tryRefresh();
        if (ok) {
          const me = await getMe();
          setUser(me);
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await apiLogin(credentials);
    const me = await getMe();
    setUser(me);
    return data;
  }, []);

  const register = useCallback(async (info) => {
    const data = await apiRegister(info);
    return data;
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
