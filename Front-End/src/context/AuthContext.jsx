// src/context/AuthContext.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { registerUser, loginUser, fetchMe, updateUser } from '../services/authApi';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRestoringSession, setIsRestoringSession] = useState(() =>
    Boolean(localStorage.getItem('token'))
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setIsRestoringSession(false);
      return;
    }

    setIsRestoringSession(true);

    fetchMe(token)
      .then((data) => setUser(data.user))
      .catch(() => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
      })
      .finally(() => {
        setIsRestoringSession(false);
      });
  }, [token]);

  const register = async (userData) => {
    setLoading(true);
    clearError();
    try {
      const data = await registerUser(userData);
      setToken(data.token);
      localStorage.setItem('token', data.token);
      setUser(data.user);
      setIsRestoringSession(false);
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
      setIsRestoringSession(false);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (userData) => {
    setLoading(true);
    clearError();
    try {
      if (!token) throw new Error('Not authenticated');
      const data = await updateUser(userData, token);
      setUser(data.user); // Dynamically update the global state
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
    setIsRestoringSession(false);
    clearError();
    localStorage.removeItem('token');
  };

  const isAuthenticated = Boolean(user && token);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        isAuthenticated,
        isRestoringSession,
        register,
        login,
        updateProfile,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
