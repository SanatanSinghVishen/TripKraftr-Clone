import { createContext, useContext, useState, useEffect } from 'react';
import { auth, setToken, clearToken } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const data = await auth.getMe();
      setUser(data.user);
      setRole(data.role);
    } catch {
      setUser(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  }

  function loginWithGoogle() {
    window.location.href = auth.getGoogleAuthUrl();
  }

  async function loginAdmin(email, password) {
    const data = await auth.adminLogin(email, password);
    setToken(data.token);
    setUser(data.admin);
    setRole('admin');
    return data;
  }

  function logout() {
    clearToken();
    setUser(null);
    setRole(null);
  }

  function handleOAuthCallback(token) {
    setToken(token);
    checkAuth();
  }

  const value = {
    user,
    role,
    loading,
    isOwner: role === 'owner',
    isAdmin: role === 'admin',
    isAuthenticated: !!user,
    loginWithGoogle,
    loginAdmin,
    logout,
    handleOAuthCallback,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
