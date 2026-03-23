// src/context/AuthContext.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { registerUser, loginUser, fetchMe } from '../services/authApi';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    if (token) {
      fetchMe(token)
        .then((data) => setUser(data.user))
        .catch(() => {
          setUser(null);
          setToken(null);
          localStorage.removeItem('token');
        });
    }
  }, [token]);

  const register = async (userData) => {
    setLoading(true);
    clearError();
    try {
      const data = await registerUser(userData);
      setToken(data.token);
      localStorage.setItem('token', data.token);
      setUser(data.user);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (userData) => {
    setLoading(true);
    clearError();
    try {
      const data = await loginUser(userData);
      setToken(data.token);
      localStorage.setItem('token', data.token);
      setUser(data.user);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    clearError();
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, error, register, login, logout, clearError }}
    >
      {children}
    </AuthContext.Provider>
  );
}
