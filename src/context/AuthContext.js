import React, { createContext, useEffect, useMemo, useState } from 'react';
import api from '../api/api';

export const AuthContext = createContext();

const setAuthHeader = (token) => {
  if (token) api.defaults.headers.common['x-auth-token'] = token;
  else delete api.defaults.headers.common['x-auth-token'];
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // validate token and fetch user
  useEffect(() => {
    const init = async () => {
      if (token) {
        setAuthHeader(token);
        try {
          const res = await api.get('/auth');
          setUser(res.data);
          setIsAuthenticated(true);
        } catch (e) {
          logout();
        }
      }
      setLoading(false);
    };
    init();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    setIsAuthenticated(true);
  };

  const register = async (email, password) => {
    const res = await api.post('/auth/register', { email, password });
    localStorage.setItem('token', res.data.token);
    setToken(res.data.token);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setAuthHeader(null);
  };

  const value = useMemo(
    () => ({ user, setUser, token, isAuthenticated, loading, login, register, logout }),
    [user, token, isAuthenticated, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
