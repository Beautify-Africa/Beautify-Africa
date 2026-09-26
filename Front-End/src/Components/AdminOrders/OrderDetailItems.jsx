export default function OrderDetailItems({ items }) {
  return (
    <div className="space-y-2.5">
      {items.map((item, index) => (
        <div
          key={`${item.productId || item.name}-${index}`}
          className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3"
        >
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="h-14 w-14 rounded-lg border border-zinc-700 object-cover shrink-0"
              loading="lazy"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-800/60 text-[9px] font-bold uppercase text-zinc-500 shrink-0">
              No Img
            </div>
          )}

          <div className="min-w-0 flex-1 text-xs">
            <p className="font-bold text-white tracking-tight">{item.name}</p>
            <p className="text-[11px] text-zinc-400">
              {item.productBrand || 'Beautify Africa'} &bull; {item.productCategory || 'Beauty'}
            </p>
            <p className="mt-1 text-[11px] font-mono text-zinc-300">
              Qty: {item.qty} &bull; Unit: {item.unitPrice} &bull; Line Total: {item.lineTotal}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
