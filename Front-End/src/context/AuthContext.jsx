// src/context/AuthContext.jsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  registerUser,
  loginUser,
  loginAdminUser,
  fetchMe,
  updateUser,
  logoutUser,
} from '../services/authApi';
import { AuthContext } from './auth-context';
import { COOKIE_SESSION_ACTIVE } from '../services/apiConfig';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // On mount, restore session via secure HttpOnly cookie (no localStorage used)
  useEffect(() => {
    const controller = new AbortController();
    setIsRestoringSession(true);

    fetchMe(null, { signal: controller.signal })
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          setToken(COOKIE_SESSION_ACTIVE);
        } else {
          setUser(null);
          setToken(null);
        }
      })
      .catch(() => {
        if (controller.signal.aborted) {
          return;
        }
        setUser(null);
        setToken(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsRestoringSession(false);
        }
      });

    return () => controller.abort();
  }, []);

  const register = async (userData) => {
    setLoading(true);
    clearError();
    try {
      const data = await registerUser(userData);
      setToken(data.user ? COOKIE_SESSION_ACTIVE : null);
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
      if (data?.require2FA) {
        return data;
      }
      setToken(data.user ? COOKIE_SESSION_ACTIVE : null);
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

  const adminLogin = async (userData) => {
    setLoading(true);
    clearError();
    try {
      const data = await loginAdminUser(userData);
      if (data?.require2FA) {
        return data;
      }
      setToken(data.user ? COOKIE_SESSION_ACTIVE : null);
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
      if (!user) throw new Error('Not authenticated');
      const data = await updateUser(userData);
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
    const activeToken = token;
    setUser(null);
    setToken(null);
    setIsRestoringSession(false);
    clearError();
    logoutUser(activeToken).catch(() => {});
  };

  const isAuthenticated = Boolean(user);
  const isAdmin = Boolean(user?.isAdmin || user?.role === 'admin');

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        isAuthenticated,
        isAdmin,
        isRestoringSession,
        register,
        login,
        adminLogin,
        updateProfile,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
