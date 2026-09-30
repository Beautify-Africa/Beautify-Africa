const SEGMENTS = [
  { key: 'all', label: 'All Patrons' },
  { key: 'vip', label: 'VIP Club' },
  { key: 'repeat', label: 'Repeat Buyers' },
  { key: 'first_time', label: 'First-Time' },
  { key: 'at_risk', label: 'At-Risk' },
  { key: 'newsletter', label: 'Subscribers' },
];

const SORT_OPTIONS = [
  { value: 'recent', label: 'Most Recent Activity' },
  { value: 'spent_desc', label: 'Highest Spend (LTV)' },
  { value: 'orders_desc', label: 'Highest Order Count' },
  { value: 'name_asc', label: 'Name (A-Z)' },
];

export default function AdminCustomersFilters({
  search,
  onSearchChange,
  segment,
  onSegmentChange,
  sort,
  onSortChange,
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800/90 bg-[#0E131F]/90 p-4 shadow-xl backdrop-blur-md lg:flex-row lg:items-center lg:justify-between">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-500">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </span>
        <input
          type="search"
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 py-2 pl-9 pr-4 text-xs text-white placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
        />
      </div>

      {/* Segment Pills & Sort Selector */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1">
          {SEGMENTS.map((seg) => (
            <button
              key={seg.key}
              type="button"
              onClick={() => onSegmentChange(seg.key)}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all ${
                segment === seg.key
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60 border border-transparent'
              }`}
            >
              {seg.label}
            </button>
          ))}
        </div>

        <div className="h-4 w-[1px] bg-zinc-800 hidden sm:block" />

        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          aria-label="Sort customer directory"
          className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-[11px] font-semibold text-zinc-300 focus:border-amber-500/50 focus:outline-none"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
