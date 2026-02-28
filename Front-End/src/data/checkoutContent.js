/**
 * Checkout form content — keeps all strings out of JSX
 */

export const CHECKOUT_COPY = {
    steps: ['Shipping', 'Payment', 'Confirmed'],
    stepLabel: 'Checkout',

    shipping: {
        heading: 'Delivery Details',
        fields: {
            firstName: 'First Name',
            lastName: 'Last Name',
            email: 'Email Address',
            address: 'Street Address',
            city: 'City',
            zip: 'Postcode / ZIP',
            country: 'Country',
        },
        placeholders: {
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane@example.com',
            address: '123 Radiance Ave',
            city: 'Nairobi',
            zip: '00100',
            country: 'Select country…',
        },
        continueBtn: 'Continue to Payment →',
    },

    payment: {
        heading: 'Payment Details',
        demoNote: '🔒 This is a front-end demo. No real payment is processed. Do not enter real card details.',
        fields: {
            cardNumber: 'Card Number',
            cardName: 'Cardholder Name',
            expiry: 'Expiry (MM/YY)',
            cvv: 'CVV',
        },
        placeholders: {
            cardNumber: '1234 5678 9012 3456',
            cardName: 'Jane Doe',
            expiry: 'MM/YY',
            cvv: '•••',
        },
        acceptedBrands: ['VISA', 'MC', 'AMEX'],
        placeOrderBtn: 'Place Order',
        backBtn: '← Back',
    },

    confirmation: {
        title: 'Order Placed!',
        emailNote: 'A confirmation will be sent to',
        orderLabel: 'Order',
        totalLabel: 'Total',
        deliveryLabel: 'Estimated delivery',
        continueBtn: 'Continue Shopping',
        deliveryDaysOffset: 5,
    },
};

export const CHECKOUT_COUNTRIES = [
    'Kenya', 'Nigeria', 'South Africa', 'Ghana', 'Ethiopia',
    'Tanzania', 'Uganda', 'Rwanda', 'Egypt', 'Morocco',
    'United Kingdom', 'United States', 'Other',
];
