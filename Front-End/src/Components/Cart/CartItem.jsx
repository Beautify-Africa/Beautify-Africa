import { MinusIcon, PlusIcon } from '../Shared/Icons';

export default function CartItem({ item, onUpdateQuantity, onRemove }) {
  return (
    <article className="flex gap-4">
      <div className="w-20 h-24 bg-stone-200 flex-shrink-0 overflow-hidden rounded-sm">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="flex-1 flex flex-col justify-between py-1">
        <div>
          <div className="flex justify-between items-start">
            <h3 className="font-serif text-lg text-stone-900 leading-none">{item.name}</h3>
            <span className="text-sm text-stone-900 font-medium">${item.price.toFixed(2)}</span>
          </div>
          <p className="text-stone-500 text-xs mt-1">{item.variant}</p>
        </div>
        <div className="flex justify-between items-end">
          <div className="flex items-center border border-stone-200">
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
              className="px-2 py-1 text-stone-500 hover:text-stone-900 transition-colors"
              aria-label={`Decrease quantity of ${item.name}`}
              disabled={item.quantity <= 1}
            >
              <MinusIcon className="w-3 h-3" />
            </button>
            <span className="px-2 text-xs text-stone-900 font-medium min-w-[24px] text-center">
              {item.quantity}
            </span>
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              className="px-2 py-1 text-stone-500 hover:text-stone-900 transition-colors"
              aria-label={`Increase quantity of ${item.name}`}
            >
              <PlusIcon className="w-3 h-3" />
            </button>
          </div>
          <button
            onClick={() => onRemove(item.id)}
            className="text-[10px] uppercase tracking-wider text-stone-400 hover:text-stone-900 underline transition-colors"
            aria-label={`Remove ${item.name} from cart`}
          >
            Remove
          </button>
        </div>
      </div>
    </article>
  );
}
