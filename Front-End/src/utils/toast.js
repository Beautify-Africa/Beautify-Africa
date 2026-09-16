import { toast } from 'sonner';

/**
 * Enterprise toast notification system wrapping Sonner with sensible defaults.
 * Provides accessible, dismissible, rich-colored toasts.
 */
export const showToast = {
  success: (message, options = {}) => {
    return toast.success(message, {
      duration: options.duration || 4000,
      ...options,
    });
  },

  error: (message, options = {}) => {
    return toast.error(message, {
      duration: options.duration || 5000,
      ...options,
    });
  },

  info: (message, options = {}) => {
    return toast.info(message, {
      duration: options.duration || 4000,
      ...options,
    });
  },

  warning: (message, options = {}) => {
    return toast.warning(message, {
      duration: options.duration || 4500,
      ...options,
    });
  },

  promise: (promise, options = {}) => {
    return toast.promise(promise, options);
  },

  dismiss: (toastId) => {
    return toast.dismiss(toastId);
  },
};

export { toast };
export default showToast;
