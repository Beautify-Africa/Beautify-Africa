import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CurrencyProvider } from './CurrencyContext';
import { useCurrency } from '../hooks/useCurrency';

function TestCurrencyConsumer() {
  const { currency, setCurrency, formatPrice, convertPrice, supportedCurrencies } = useCurrency();

  return (
    <div>
      <div data-testid="current-currency">{currency}</div>
      <div data-testid="price-usd">{formatPrice(10)}</div>
      <div data-testid="converted-numeric">{convertPrice(10)}</div>
      <div data-testid="supported-count">{supportedCurrencies.length}</div>

      <button onClick={() => setCurrency('KES')}>Switch to KES</button>
      <button onClick={() => setCurrency('NGN')}>Switch to NGN</button>
      <button onClick={() => setCurrency('EUR')}>Switch to EUR</button>
    </div>
  );
}

describe('CurrencyContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('provides currency and formats price according to active selection', () => {
    localStorage.setItem('beautify_currency', 'USD');
    render(
      <CurrencyProvider>
        <TestCurrencyConsumer />
      </CurrencyProvider>
    );

    expect(screen.getByTestId('current-currency').textContent).toBe('USD');
    expect(screen.getByTestId('price-usd').textContent).toBe('$10.00');
    expect(Number(screen.getByTestId('supported-count').textContent)).toBeGreaterThanOrEqual(6);
  });

  it('switches currency to KES and updates formatting and conversion', () => {
    render(
      <CurrencyProvider>
        <TestCurrencyConsumer />
      </CurrencyProvider>
    );

    fireEvent.click(screen.getByText('Switch to KES'));

    expect(screen.getByTestId('current-currency').textContent).toBe('KES');
    // 10 USD * 130 = 1300 KES
    expect(screen.getByTestId('price-usd').textContent).toBe('KSh 1,300');
    expect(screen.getByTestId('converted-numeric').textContent).toBe('1300');
    expect(localStorage.getItem('beautify_currency')).toBe('KES');
  });

  it('switches currency to NGN and persists to localStorage', () => {
    render(
      <CurrencyProvider>
        <TestCurrencyConsumer />
      </CurrencyProvider>
    );

    fireEvent.click(screen.getByText('Switch to NGN'));

    expect(screen.getByTestId('current-currency').textContent).toBe('NGN');
    // 10 USD * 1500 = 15000 NGN
    expect(screen.getByTestId('price-usd').textContent).toBe('₦ 15,000');
    expect(localStorage.getItem('beautify_currency')).toBe('NGN');
  });

  it('initializes from existing localStorage value if present', () => {
    localStorage.setItem('beautify_currency', 'EUR');

    render(
      <CurrencyProvider>
        <TestCurrencyConsumer />
      </CurrencyProvider>
    );

    expect(screen.getByTestId('current-currency').textContent).toBe('EUR');
    // 10 USD * 0.92 = 9.20 EUR
    expect(screen.getByTestId('price-usd').textContent).toBe('€9.20');
  });
});
