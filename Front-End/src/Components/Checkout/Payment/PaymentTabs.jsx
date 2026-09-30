export default function PaymentTabs({ activeTab, onSelectTab }) {
  return (
    <div className="grid grid-cols-3 gap-2 rounded-sm bg-stone-100 p-1">
      <button
        type="button"
        onClick={() => onSelectTab('stripe')}
        className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-sm text-center transition-all ${
          activeTab === 'stripe'
            ? 'bg-white text-stone-900 shadow-sm font-bold'
            : 'text-stone-500 hover:text-stone-900 font-medium'
        }`}
      >
        <span className="text-xs">💳</span>
        <span className="text-[10px] tracking-wider uppercase mt-0.5">Card (Stripe)</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectTab('paystack')}
        className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-sm text-center transition-all ${
          activeTab === 'paystack'
            ? 'bg-white text-stone-900 shadow-sm font-bold'
            : 'text-stone-500 hover:text-stone-900 font-medium'
        }`}
      >
        <span className="text-xs">⚡</span>
        <span className="text-[10px] tracking-wider uppercase mt-0.5">Paystack</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectTab('mpesa')}
        className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-sm text-center transition-all ${
          activeTab === 'mpesa'
            ? 'bg-white text-stone-900 shadow-sm font-bold'
            : 'text-stone-500 hover:text-stone-900 font-medium'
        }`}
      >
        <span className="text-xs">📱</span>
        <span className="text-[10px] tracking-wider uppercase mt-0.5">M-Pesa</span>
      </button>
    </div>
  );
}
