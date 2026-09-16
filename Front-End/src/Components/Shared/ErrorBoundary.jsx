import { Component } from 'react';
import ErrorFallback from './ErrorFallback';

/**
 * Enterprise-grade ErrorBoundary component to gracefully handle React render errors.
 * Provides fallback UI, error reporting hooks, and component recovery reset.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
    this.resetErrorBoundary = this.resetErrorBoundary.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (typeof this.props.onError === 'function') {
      try {
        this.props.onError(error, errorInfo);
      } catch (e) {
        console.error('ErrorBoundary: onError callback failed', e);
      }
    }

    // Log caught error
    console.error('[ErrorBoundary caught error]', error, errorInfo?.componentStack);
  }

  resetErrorBoundary() {
    if (typeof this.props.onReset === 'function') {
      try {
        this.props.onReset();
      } catch (e) {
        console.error('ErrorBoundary: onReset callback failed', e);
      }
    }
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError) {
      const { fallback } = this.props;

      if (typeof fallback === 'function') {
        return fallback({
          error: this.state.error,
          resetErrorBoundary: this.resetErrorBoundary,
        });
      }

      if (fallback) {
        return fallback;
      }

      return (
        <ErrorFallback error={this.state.error} resetErrorBoundary={this.resetErrorBoundary} />
      );
    }

    return this.props.children;
  }
}
