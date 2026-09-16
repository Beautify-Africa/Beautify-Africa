import { useState } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

function ProblematicComponent({ shouldThrow }) {
  if (shouldThrow) {
    throw new Error('Test explosion in component');
  }
  return <div>Component rendered successfully</div>;
}

describe('ErrorBoundary Component', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    // Suppress expected React error logging during test runs
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders children normally when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <ProblematicComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Component rendered successfully')).toBeInTheDocument();
  });

  it('catches render errors and displays fallback UI', () => {
    render(
      <ErrorBoundary>
        <ProblematicComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/unexpected issue while loading this section/i)).toBeInTheDocument();
  });

  it('triggers the onError callback with error and component info', () => {
    const onErrorMock = vi.fn();

    render(
      <ErrorBoundary onError={onErrorMock}>
        <ProblematicComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onErrorMock).toHaveBeenCalledTimes(1);
    const [error, info] = onErrorMock.mock.calls[0];
    expect(error.message).toBe('Test explosion in component');
    expect(info).toHaveProperty('componentStack');
  });

  it('supports a custom fallback element', () => {
    render(
      <ErrorBoundary fallback={<div data-testid="custom-fallback">Custom Error View</div>}>
        <ProblematicComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.getByText('Custom Error View')).toBeInTheDocument();
  });

  it('supports a custom fallback render function with reset capability', () => {
    const onResetMock = vi.fn();

    function Parent() {
      const [shouldThrow, setShouldThrow] = useState(true);

      return (
        <div>
          <button onClick={() => setShouldThrow(false)}>Fix Error</button>
          <ErrorBoundary
            onReset={onResetMock}
            fallback={({ error, resetErrorBoundary }) => (
              <div>
                <p>Error: {error.message}</p>
                <button onClick={resetErrorBoundary}>Recover</button>
              </div>
            )}
          >
            <ProblematicComponent shouldThrow={shouldThrow} />
          </ErrorBoundary>
        </div>
      );
    }

    render(<Parent />);
    expect(screen.getByText('Error: Test explosion in component')).toBeInTheDocument();

    // Fix the cause in React state, then trigger boundary recovery
    fireEvent.click(screen.getByText('Fix Error'));
    fireEvent.click(screen.getByText('Recover'));

    expect(onResetMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Component rendered successfully')).toBeInTheDocument();
  });
});
