import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { api, getToken, setToken as persistToken } from '../utils/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTok] = useState(getToken());
  const [user, setUser] = useState(null);

  // Synchronize user state when token changes or is loaded from sessionStorage
  useEffect(() => {
    if (token) {
      try {
        const [body] = token.split('.');
        if (body) {
          const payload = JSON.parse(atob(body.replace(/-/g, '+').replace(/_/g, '/')));
          if (payload.exp && payload.exp > Date.now()) {
            setUser({ role: payload.role || 'admin' });
            return;
          }
        }
      } catch {
        // Fallback if not valid base64url or expired
      }
      // If we got here with a token, default to admin role or clear if invalid
      setUser({ role: 'admin' });
    } else {
      setUser(null);
    }
  }, [token]);

  const login = useCallback(async (password) => {
    const data = await api('/api/admin/login', {
      method: 'POST',
      body: { password },
    });
    if (data.token) {
      persistToken(data.token);
      setTok(data.token);
      setUser({ role: 'admin' });
    }
    return data;
  }, []);

  const logout = useCallback(() => {
    persistToken('');
    setTok('');
    setUser(null);
  }, []);

  const value = useMemo(() => ({
    token,
    user,
    isAdmin: !!(token && user?.role === 'admin'),
    login,
    logout,
  }), [token, user, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // Graceful fallback if used outside AuthProvider
    const tok = getToken();
    return {
      token: tok,
      user: tok ? { role: 'admin' } : null,
      isAdmin: !!tok,
      login: async () => {},
      logout: () => {},
    };
  }
  return ctx;
};
