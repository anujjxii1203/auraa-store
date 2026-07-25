import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  });

  const setSession = ({ user: nextUser, token }) => {
    setUser(nextUser);
    if (nextUser) {
      localStorage.setItem('user', JSON.stringify(nextUser));
    } else {
      localStorage.removeItem('user');
    }
    // Token is mostly managed by cookies now, but we'll store it if provided for mobile fallback
    if (token) {
      localStorage.setItem('token', token);
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (err) {
      console.warn("Logout endpoint failed, clearing local state.");
    } finally {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('auth-logout'));
    }
  };

  useEffect(() => {
    const handleGlobalLogout = () => {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    };
    window.addEventListener('auth-logout', handleGlobalLogout);
    return () => window.removeEventListener('auth-logout', handleGlobalLogout);
  }, []);

  useEffect(() => {
    // Sync session on mount
    const syncSession = async () => {
      try {
        const { data } = await api.get('/api/me');
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      } catch (err) {
        // Only clear session if server explicitly rejects auth (401)
        if (err.response?.status === 401) {
          setUser(null);
          localStorage.removeItem('user');
        } else {
          console.warn("Failed to sync session, but keeping local state.", err);
        }
      }
    };
    syncSession();
  }, []);

  return (
    <UserContext.Provider value={{ isAuthenticated: Boolean(user), logout, setSession, updateUser, user }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
