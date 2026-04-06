export default function PriceRangeSlider({ value, max, onChange }) {
  return (
    <div>
      <input
        type="range"
        min="0"
        max={max}
        value={value}
        onChange={(event) => onChange(parseInt(event.target.value, 10))}
        className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-stone-300 accent-stone-900"
        aria-label="Maximum price"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
      />
      <div className="mt-2 flex justify-between font-mono text-xs text-stone-600">
        <span>$0</span>
        <span>${value}</span>
      </div>
    </div>
  );
}
