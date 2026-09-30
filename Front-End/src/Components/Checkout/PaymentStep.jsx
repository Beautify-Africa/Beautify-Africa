import { useState } from 'react';
import { useCurrency } from '../../hooks/useCurrency';
import PaymentTabs from './Payment/PaymentTabs';
import StripePaymentForm from './Payment/StripePaymentForm';
import PaystackPaymentForm from './Payment/PaystackPaymentForm';
import MpesaPaymentForm from './Payment/MpesaPaymentForm';

export default function PaymentStep({ order, token, onBack, onSuccess }) {
  const { currency, formatPrice } = useCurrency();

  // Pick intelligent default tab based on active currency
  const [activeTab, setActiveTab] = useState(() => {
    if (currency === 'KES') return 'mpesa';
    if (['NGN', 'GHS', 'ZAR'].includes(currency)) return 'paystack';
    return 'stripe';
  });

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-serif text-xl text-stone-900">Payment Method</h3>
        <p className="text-xs text-stone-500 mt-1">
          Select your preferred payment rail. Order total:{' '}
          <strong className="text-stone-900 font-bold">{formatPrice(order?.totalPrice)}</strong>
        </p>
      </div>

      <PaymentTabs activeTab={activeTab} onSelectTab={setActiveTab} />

      <div className={activeTab === 'stripe' ? 'block' : 'hidden'}>
        <StripePaymentForm
          order={order}
          formatPrice={formatPrice}
          onBack={onBack}
          onSuccess={onSuccess}
        />
      </div>

      {activeTab === 'paystack' && (
        <PaystackPaymentForm
          order={order}
          currency={currency}
          token={token}
          formatPrice={formatPrice}
          onBack={onBack}
          onSuccess={onSuccess}
        />
      )}

      {activeTab === 'mpesa' && (
        <MpesaPaymentForm
          order={order}
          token={token}
          formatPrice={formatPrice}
          onBack={onBack}
          onSuccess={onSuccess}
        />
      )}
    </div>
  );
}
