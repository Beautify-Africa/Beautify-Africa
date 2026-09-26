import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function AdminInlineSignIn() {
  const { adminLogin, loading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    clearError();
    return clearError;
  }, [clearError]);

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      await adminLogin({ email: email.trim(), password });
    } catch {
      // Auth context handles inline error messaging.
    }
  }

  return (
    <div className="mx-auto mt-6 max-w-sm rounded-xl border border-zinc-800/90 bg-zinc-900/80 p-5 text-left">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
          Owner Sign In
        </p>
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      </div>

      <form className="mt-4 space-y-3.5" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="inline-admin-email"
            className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1"
          >
            System Owner Email
          </label>
          <input
            id="inline-admin-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="owner@beautifyafrica.app"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="inline-admin-password"
              className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400"
            >
              Master Password
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-[9px] uppercase tracking-wider text-zinc-500 hover:text-zinc-300"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <input
            id="inline-admin-password"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 font-mono"
          />
        </div>

        {error ? (
          <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-amber-500 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-amber-400 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Authorize Access'}
        </button>
      </form>
    </div>
  );
}
