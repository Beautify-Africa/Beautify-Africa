import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../hooks/useAuth';

export default function AdminLoginPage() {
  const { adminLogin, isAuthenticated, isAdmin, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [unauthorizedNotice, setUnauthorizedNotice] = useState(
    Boolean(location.state?.unauthorized)
  );

  // If already authenticated as admin, redirect to admin studio
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      const destination = location.state?.from?.pathname || '/admin/orders';
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, isAdmin, navigate, location.state]);

  useEffect(() => {
    clearError();
    return clearError;
  }, [clearError]);

  async function handleSubmit(e) {
    e.preventDefault();
    setUnauthorizedNotice(false);

    try {
      await adminLogin({ email: email.trim(), password });
      const destination = location.state?.from?.pathname || '/admin/orders';
      navigate(destination, { replace: true });
    } catch {
      // Auth context sets error state
    }
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-zinc-100 flex flex-col justify-between selection:bg-amber-500/20 selection:text-amber-200 relative overflow-hidden font-sans">
      <Helmet>
        <title>Admin Studio Security Gate | Beautify Africa</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-600/10 via-indigo-900/10 to-transparent pointer-events-none blur-3xl" />
      <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-600/5 via-transparent to-transparent pointer-events-none blur-3xl" />

      {/* Top bar */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
          <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-zinc-400">
            Beautify Africa Ops
          </span>
        </div>

        <Link
          to="/"
          className="text-[11px] font-semibold text-zinc-400 hover:text-zinc-100 transition-colors flex items-center gap-1.5 group"
        >
          <svg
            className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Storefront
        </Link>
      </header>

      {/* Center login container */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[440px]">
          {/* Card wrapper with subtle hairline border */}
          <div className="rounded-2xl border border-zinc-800/90 bg-[#0E131F]/95 backdrop-blur-2xl p-8 sm:p-10 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.8)]">
            {/* Header badges & titles */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-300 mb-6 shadow-inner">
                <svg className="w-3 h-3 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Restricted Perimeter
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Admin Studio Vault
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xs mx-auto">
                Authorized access only. Verified system owner credentials are required.
              </p>
            </div>

            {/* Warning or Error Notices */}
            {unauthorizedNotice && (
              <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-300 flex items-start gap-2.5">
                <svg className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Current session lacks administrator privileges. Please sign in with system owner credentials.</span>
              </div>
            )}

            {error && (
              <div className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 flex items-start gap-2.5">
                <svg className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div>
                <label
                  htmlFor="admin-email"
                  className="block text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-300 mb-2"
                >
                  System Owner Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    id="admin-email"
                    type="email"
                    required
                    autoFocus
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@beautifyafrica.app"
                    className="w-full rounded-xl border border-zinc-700/80 bg-zinc-900/90 pl-10 pr-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="admin-password"
                    className="block text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-300"
                  >
                    Master Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[10px] uppercase tracking-wider text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl border border-zinc-700/80 bg-zinc-900/90 pl-10 pr-10 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 p-[1px] font-bold tracking-wider uppercase text-xs disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(217,119,6,0.35)] transition-transform active:scale-[0.99]"
                >
                  <div className="px-6 py-3.5 rounded-[11px] bg-zinc-950/40 backdrop-blur-sm group-hover:bg-transparent transition-colors flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Verifying Credentials...</span>
                      </>
                    ) : (
                      <>
                        <span>Authorize Session</span>
                        <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
                  </div>
                </button>
              </div>
            </form>

            {/* Security Guarantee Footer */}
            <div className="mt-8 pt-6 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                TLS 1.3 256-Bit Encrypted
              </span>
              <span>Sole Owner Whitelist</span>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom status bar */}
      <footer className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 text-center text-xs text-zinc-600">
        Beautify Africa Operations Security Framework &bull; Enterprise Grade
      </footer>
    </div>
  );
}
