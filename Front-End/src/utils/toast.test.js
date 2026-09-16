import { describe, it, expect, vi } from 'vitest';
import { toast } from 'sonner';
import { showToast } from './toast';

vi.mock('sonner', () => {
  const mockToast = {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    promise: vi.fn(),
    dismiss: vi.fn(),
  };
  return {
    toast: mockToast,
  };
});

describe('toast utility wrapper', () => {
  it('calls toast.success with default duration', () => {
    showToast.success('Item added to bag');
    expect(toast.success).toHaveBeenCalledWith('Item added to bag', {
      duration: 4000,
    });
  });

  it('calls toast.error with custom duration override', () => {
    showToast.error('Payment failed', { duration: 6000 });
    expect(toast.error).toHaveBeenCalledWith('Payment failed', {
      duration: 6000,
    });
  });

  it('calls toast.info and toast.warning correctly', () => {
    showToast.info('New seasonal drop available');
    expect(toast.info).toHaveBeenCalledWith('New seasonal drop available', {
      duration: 4000,
    });

    showToast.warning('Only 2 items left in stock');
    expect(toast.warning).toHaveBeenCalledWith('Only 2 items left in stock', {
      duration: 4500,
    });
  });

  it('delegates promise and dismiss correctly', () => {
    const dummyPromise = Promise.resolve();
    showToast.promise(dummyPromise, { loading: 'Processing...' });
    expect(toast.promise).toHaveBeenCalledWith(dummyPromise, {
      loading: 'Processing...',
    });

    showToast.dismiss('toast-123');
    expect(toast.dismiss).toHaveBeenCalledWith('toast-123');
  });
});
