import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CartProvider } from './CartContext';
import { useCart } from '../hooks/useCart';
import * as authHook from '../hooks/useAuth';

vi.mock('../hooks/useAuth');

function TestCartConsumer() {
  const { cartItems, cartCount, subtotal, addItem, updateQuantity, removeItem, clearCart } =
    useCart();

  return (
    <div>
      <div data-testid="cart-count">{cartCount}</div>
      <div data-testid="subtotal">{subtotal}</div>
      <div data-testid="items-length">{cartItems.length}</div>

      <ul>
        {cartItems.map((item) => (
          <li key={item.id} data-testid={`item-${item.id}`}>
            <span>{item.name}</span>
            <span>Qty: {item.quantity}</span>
            <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+1 {item.id}</button>
            <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-1 {item.id}</button>
            <button onClick={() => removeItem(item.id)}>Remove {item.id}</button>
          </li>
        ))}
      </ul>

      <button
        onClick={() =>
          addItem({
            _id: 'prod-1',
            name: 'Marula Oil Serum',
            price: 50,
            image: '/images/marula.jpg',
          })
        }
      >
        Add Marula
      </button>

      <button
        onClick={() =>
          addItem({
            _id: 'prod-2',
            name: 'Baobab Body Butter',
            price: 30,
            image: '/images/baobab.jpg',
          })
        }
      >
        Add Baobab
      </button>

      <button onClick={clearCart}>Clear All</button>
    </div>
  );
}

describe('CartContext & State Management', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      isAuthenticated: false,
      token: null,
      user: null,
    });
  });

  it('initializes with an empty cart', () => {
    render(
      <CartProvider>
        <TestCartConsumer />
      </CartProvider>
    );

    expect(screen.getByTestId('cart-count')).toHaveTextContent('0');
    expect(screen.getByTestId('subtotal')).toHaveTextContent('0');
    expect(screen.getByTestId('items-length')).toHaveTextContent('0');
  });

  it('adds items and correctly computes cartCount and subtotal', () => {
    render(
      <CartProvider>
        <TestCartConsumer />
      </CartProvider>
    );

    fireEvent.click(screen.getByText('Add Marula'));
    expect(screen.getByTestId('cart-count')).toHaveTextContent('1');
    expect(screen.getByTestId('subtotal')).toHaveTextContent('50');
    expect(screen.getByTestId('items-length')).toHaveTextContent('1');

    fireEvent.click(screen.getByText('Add Baobab'));
    expect(screen.getByTestId('cart-count')).toHaveTextContent('2');
    expect(screen.getByTestId('subtotal')).toHaveTextContent('80');
    expect(screen.getByTestId('items-length')).toHaveTextContent('2');
  });

  it('increments quantity when adding an existing item instead of creating duplicate line', () => {
    render(
      <CartProvider>
        <TestCartConsumer />
      </CartProvider>
    );

    fireEvent.click(screen.getByText('Add Marula'));
    fireEvent.click(screen.getByText('Add Marula'));

    expect(screen.getByTestId('cart-count')).toHaveTextContent('2');
    expect(screen.getByTestId('subtotal')).toHaveTextContent('100');
    expect(screen.getByTestId('items-length')).toHaveTextContent('1');
  });

  it('updates item quantities and recalculates total', () => {
    render(
      <CartProvider>
        <TestCartConsumer />
      </CartProvider>
    );

    fireEvent.click(screen.getByText('Add Marula'));
    fireEvent.click(screen.getByText('+1 prod-1'));

    expect(screen.getByTestId('cart-count')).toHaveTextContent('2');
    expect(screen.getByTestId('subtotal')).toHaveTextContent('100');

    fireEvent.click(screen.getByText('-1 prod-1'));
    expect(screen.getByTestId('cart-count')).toHaveTextContent('1');
    expect(screen.getByTestId('subtotal')).toHaveTextContent('50');
  });

  it('removes item when quantity is decremented to 0', () => {
    render(
      <CartProvider>
        <TestCartConsumer />
      </CartProvider>
    );

    fireEvent.click(screen.getByText('Add Marula'));
    expect(screen.getByTestId('cart-count')).toHaveTextContent('1');

    fireEvent.click(screen.getByText('-1 prod-1'));
    expect(screen.getByTestId('cart-count')).toHaveTextContent('0');
    expect(screen.getByTestId('items-length')).toHaveTextContent('0');
  });

  it('removes an item explicitly via removeItem', () => {
    render(
      <CartProvider>
        <TestCartConsumer />
      </CartProvider>
    );

    fireEvent.click(screen.getByText('Add Marula'));
    fireEvent.click(screen.getByText('Add Baobab'));
    expect(screen.getByTestId('items-length')).toHaveTextContent('2');

    fireEvent.click(screen.getByText('Remove prod-1'));
    expect(screen.getByTestId('items-length')).toHaveTextContent('1');
    expect(screen.getByTestId('cart-count')).toHaveTextContent('1');
    expect(screen.getByTestId('subtotal')).toHaveTextContent('30');
  });

  it('clears all items when clearCart is triggered', () => {
    render(
      <CartProvider>
        <TestCartConsumer />
      </CartProvider>
    );

    fireEvent.click(screen.getByText('Add Marula'));
    fireEvent.click(screen.getByText('Add Baobab'));
    expect(screen.getByTestId('cart-count')).toHaveTextContent('2');

    fireEvent.click(screen.getByText('Clear All'));
    expect(screen.getByTestId('cart-count')).toHaveTextContent('0');
    expect(screen.getByTestId('subtotal')).toHaveTextContent('0');
    expect(screen.getByTestId('items-length')).toHaveTextContent('0');
  });
});
