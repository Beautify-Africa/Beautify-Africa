export default function AdminCustomersHeader({ onExportCsv, onRefresh, isLoading }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Customer Intelligence
          </h1>
          <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-300">
            Live Directory
          </span>
        </div>
        <p className="mt-1.5 text-xs text-zinc-400">
          Client relationship telemetry, lifetime spend (LTV), VIP segment tiers, and engagement history.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onExportCsv}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 text-xs font-semibold text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-700 hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          aria-label="Refresh customer directory"
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/80 p-2.5 text-xs font-semibold text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-700 hover:text-white disabled:opacity-50"
        >
          <svg className={`h-4 w-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>
  );
}
