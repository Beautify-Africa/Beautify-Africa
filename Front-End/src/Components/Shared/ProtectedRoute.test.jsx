import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import * as authHook from '../../hooks/useAuth';

vi.mock('../../hooks/useAuth');

describe('ProtectedRoute Component', () => {
  function renderWithRouter(ui, initialEntries = ['/protected']) {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/" element={<div>Public Home Page</div>} />
          <Route path="/protected" element={ui} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('renders loading indicator while session is being restored', () => {
    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      isAuthenticated: false,
      isRestoringSession: true,
      user: null,
    });

    renderWithRouter(
      <ProtectedRoute>
        <div>Top Secret Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Verifying session...')).toBeInTheDocument();
    expect(screen.queryByText('Top Secret Content')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated users to home page', () => {
    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      isAuthenticated: false,
      isRestoringSession: false,
      user: null,
    });

    renderWithRouter(
      <ProtectedRoute>
        <div>Top Secret Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Public Home Page')).toBeInTheDocument();
    expect(screen.queryByText('Top Secret Content')).not.toBeInTheDocument();
  });

  it('redirects non-admin users when adminOnly is required', () => {
    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      isRestoringSession: false,
      user: { id: 'cust-1', name: 'Customer', role: 'customer', isAdmin: false },
    });

    renderWithRouter(
      <ProtectedRoute adminOnly>
        <div>Admin Dashboard</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Public Home Page')).toBeInTheDocument();
    expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument();
  });

  it('renders children when authenticated user has admin privileges', () => {
    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      isRestoringSession: false,
      user: { id: 'adm-1', name: 'Admin User', role: 'admin', isAdmin: true },
    });

    renderWithRouter(
      <ProtectedRoute adminOnly>
        <div>Admin Dashboard</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  it('renders children for standard customer on standard protected route', () => {
    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      isRestoringSession: false,
      user: { id: 'cust-1', name: 'Customer User', role: 'customer' },
    });

    renderWithRouter(
      <ProtectedRoute>
        <div>Customer Order History</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Customer Order History')).toBeInTheDocument();
  });
});
