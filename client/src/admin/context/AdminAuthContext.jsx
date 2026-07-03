import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../../api/client';

const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAdmin = async () => {
    try {
      const response = await api.get('/admin/auth/me');
      setAdmin(response.data.admin);
    } catch (error) {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmin();
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/admin/auth/login', { email, password });
    setAdmin(response.data.admin);
    return response.data;
  };

  const logout = async () => {
    try {
      await api.post('/admin/auth/logout');
    } finally {
      setAdmin(null);
    }
  };

  const hasPermission = (permission) => {
    if (!admin) return false;
    if (admin.role === 'Super Admin') return true;
    return admin.permissions?.includes(permission);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout, hasPermission }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);
