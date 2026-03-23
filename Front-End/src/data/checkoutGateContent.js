/**
 * Auth gate step content - all strings for the checkout auth gate
 */

export const GATE_CONTENT = {
  heading: 'How would you like to continue?',
  subheading: 'Sign in for a faster checkout, or continue as a guest.',

  options: {
    login: {
      icon: 'account',
      title: 'Sign In',
      description: 'Access your saved addresses and order history',
      badge: 'Welcome Back',
      submitLabel: 'Sign In & Continue',
      switchText: 'Need an account?',
      switchLabel: 'Register instead',
    },
    register: {
      icon: 'spark',
      title: 'Create Account',
      description: 'Save your details for faster checkout next time',
      badge: 'Join the Society',
      submitLabel: 'Create Account & Continue',
      switchText: 'Already a member?',
      switchLabel: 'Sign in instead',
    },
    guest: {
      icon: 'bag',
      title: 'Continue as Guest',
      description: 'No account needed. You can create one later.',
    },
  },

  formFields: {
    name: {
      id: 'gate-name',
      type: 'text',
      label: 'Full Name',
      placeholder: 'Full Name',
      autoComplete: 'name',
    },
    email: {
      id: 'gate-email',
      type: 'email',
      label: 'Email Address',
      placeholder: 'Email',
      autoComplete: 'email',
    },
    password: {
      id: 'gate-password',
      type: 'password',
      label: 'Password',
      placeholder: 'Password',
      autoComplete: 'current-password',
    },
  },

  termsText: 'I agree to the',
  termsLabel: 'Terms of Service',
  privacyLabel: 'Privacy Policy',
  backLabel: 'Back to options',
};

export const GUEST_CONVERSION = {
  heading: 'Save your details for next time?',
  description: 'Create a password to track this order and checkout faster.',
  passwordPlaceholder: 'Create a password',
  submitLabel: 'Create My Account',
  skipLabel: 'No thanks',
  successHeading: 'Account Created!',
  successMessage: 'You can now track orders and enjoy faster checkout.',
};
