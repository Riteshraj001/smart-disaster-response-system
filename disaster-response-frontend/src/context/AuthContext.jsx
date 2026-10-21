import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AUTH_STORAGE_KEY = 'smart_disaster_auth';
const VALID_ROLES = new Set(['citizen', 'team', 'authority', 'admin']);
const AuthContext = createContext(null);

const getStoredSession = () => {
  try {
    const stored = sessionStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem(AUTH_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : null;
    if (parsed && typeof parsed === 'object') {
      // Normalize 'authority' to 'team' if encountered
      if (parsed.role === 'authority') parsed.role = 'team';
      if (VALID_ROLES.has(parsed.role)) return parsed;
    }
    return null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setSession(getStoredSession());
    setIsReady(true);
  }, []);

  const signIn = ({ role, name, rememberMe = false, token = null, teamIdentifier = null, trackingToken = null }) => {
    const normalizedRole = role === 'authority' ? 'team' : role;
    const nextSession = {
      role: normalizedRole,
      name: name || normalizedRole,
      token,
      teamIdentifier,
      trackingToken,
      signedInAt: new Date().toISOString()
    };
    const storage = rememberMe ? localStorage : sessionStorage;
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
  };

  const signOut = () => {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setSession(null);
  };

  const value = useMemo(() => ({ session, isReady, signIn, signOut }), [isReady, session]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export default AuthContext;
