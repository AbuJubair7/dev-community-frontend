import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

/** Decode JWT payload to extract userId (field: 'id') */
export function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return {};
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('dc_token') || null);
  const [user, setUser]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('dc_user') || 'null'); } catch { return null; }
  });

  const login = (newToken, userData) => {
    // Always extract _id from the JWT payload so isOwner checks work correctly
    const payload = parseJwt(newToken);
    const enriched = { ...userData, _id: payload.id || payload.sub || userData._id };
    localStorage.setItem('dc_token', newToken);
    localStorage.setItem('dc_user', JSON.stringify(enriched));
    setToken(newToken);
    setUser(enriched);
  };

  const updateUser = (userData) => {
    const current = user || {};
    const merged = { ...current, ...userData };
    localStorage.setItem('dc_user', JSON.stringify(merged));
    setUser(merged);
  };

  const logout = () => {
    localStorage.removeItem('dc_token');
    localStorage.removeItem('dc_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, updateUser, isAuth: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
