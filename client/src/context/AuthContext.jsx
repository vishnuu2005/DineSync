import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('cafe_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('cafe_token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          const fullUser = { ...res.data, token };
          setUser(fullUser);
          localStorage.setItem('cafe_user', JSON.stringify(fullUser));
        } catch (err) {
          console.error('Failed to verify token:', err);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const userData = res.data;
    setUser(userData);
    localStorage.setItem('cafe_token', userData.token);
    localStorage.setItem('cafe_user', JSON.stringify(userData));
    return userData;
  };

  const register = async (name, email, phone, password, confirmPassword) => {
    const res = await api.post('/auth/register', {
      name,
      email,
      phone,
      password,
      confirmPassword,
    });
    const userData = res.data;
    setUser(userData);
    localStorage.setItem('cafe_token', userData.token);
    localStorage.setItem('cafe_user', JSON.stringify(userData));
    return userData;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('cafe_token');
    localStorage.removeItem('cafe_user');
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAdmin: user?.role === 'admin',
    isChef: user?.role === 'chef',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
