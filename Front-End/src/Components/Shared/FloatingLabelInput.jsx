export default function FloatingLabelInput({ field, value, onChange, required = true }) {
  return (
    <div className="relative">
      <input
        type={field.type}
        id={field.id}
        name={field.name || field.id}
        value={value}
        onChange={onChange}
        className="peer w-full border-b border-stone-300 bg-transparent pt-4 py-2 text-stone-900 transition-colors placeholder-transparent focus:border-stone-900 focus:outline-none"
        placeholder={field.placeholder}
        autoComplete={field.autoComplete}
        required={required}
      />

      <label
        htmlFor={field.id}
        className="absolute top-0 left-0 text-[10px] uppercase tracking-wider text-stone-400 transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-xs peer-focus:top-0 peer-focus:text-[10px] peer-focus:text-stone-800"
      >
        {field.label}
      </label>
    </div>
  );
}
