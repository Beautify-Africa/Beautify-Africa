function DetailSection({ title, children }) {
  return (
    <div>
      <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-900 mb-2">
        {title}
      </h4>
      {children}
    </div>
  );
}

function SkinTypeTags({ skinTypes = [] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {skinTypes.map((type) => (
        <span
          key={type}
          className="px-2 py-1 bg-stone-100 text-stone-600 text-[9px] uppercase tracking-wider"
        >
          {type}
        </span>
      ))}
    </div>
  );
}

export default function ProductDetailsTab({ product }) {
  return (
    <footer className="space-y-6 pt-2 mt-auto">
      <DetailSection title="Ingredients">
        <p className="text-xs text-stone-500 leading-relaxed font-mono">{product.ingredients}</p>
      </DetailSection>

      <DetailSection title="How to Use">
        <p className="text-xs text-stone-500 leading-relaxed">{product.howToUse}</p>
      </DetailSection>

      <DetailSection title="Recommended For">
        <SkinTypeTags skinTypes={product.skinType} />
      </DetailSection>
    </footer>
  );
}
