import { createContext, useContext, useState, useEffect } from 'react';
import { authService, profileService } from '../services/services';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if we have a valid session on mount
    profileService.getProfile()
      .then((res) => setUser(res.data.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (credentials) => {
    const res = await authService.login(credentials);
    const profile = await profileService.getProfile();
    setUser(profile.data.data);
    return res.data;
  };

  const register = async (data) => {
    const res = await authService.register(data);
    return res.data;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    // Full reload clears all client-side state and cache
    window.location.href = '/login';
  };

  const refreshUser = async () => {
    const profile = await profileService.getProfile();
    setUser(profile.data.data);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
