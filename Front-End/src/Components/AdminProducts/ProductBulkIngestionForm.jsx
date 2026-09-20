export default function ProductBulkIngestionForm({
  bulkImportText,
  isBulkImporting,
  onImport,
  onImportTextChange,
}) {
  return (
    <form
      className="mt-8 rounded-2xl border border-zinc-800/80 bg-[#090D16] p-5"
      onSubmit={onImport}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-zinc-200">Bulk Ingestion Pipeline</h4>
          <p className="mt-1 text-xs text-zinc-400">
            Paste CSV rows with headers. Nested fields support pipe-delimited values for{' '}
            <span className="font-mono text-amber-300">images</span>,{' '}
            <span className="font-mono text-amber-300">skinType</span>, and{' '}
            <span className="font-mono text-amber-300">tags</span>;{' '}
            <span className="font-mono text-amber-300">variants</span> accepts JSON arrays.
          </p>
        </div>
        <button
          type="submit"
          disabled={isBulkImporting || !bulkImportText.trim()}
          className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-zinc-200 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
        >
          {isBulkImporting ? 'Ingesting Batch...' : 'Run Bulk Ingestion'}
        </button>
      </div>
      <textarea
        rows={5}
        value={bulkImportText}
        onChange={(event) => onImportTextChange(event.target.value)}
        placeholder="Paste raw CSV payload here..."
        className="mt-4 w-full rounded-xl border border-zinc-800 bg-[#0E131F] px-3.5 py-2 font-mono text-xs text-zinc-200 placeholder-zinc-600 focus:border-amber-400 focus:outline-none"
      />
    </form>
  );
}
