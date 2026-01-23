/**
 * Auth Modal content configuration
 * Centralized data for the AuthModal component
 */

export const AUTH_CONTENT = {
  login: {
    badge: 'Welcome Back',
    heading: 'Sign In',
    submitLabel: 'Enter',
    switchText: 'Not a member yet?',
    switchLabel: 'Apply for membership',
  },
  register: {
    badge: 'Join the Society',
    heading: 'Register',
    submitLabel: 'Create Account',
    switchText: 'Already have an account?',
    switchLabel: 'Sign In',
  },
};

export const AUTH_IMAGE = {
  src: 'https://images.unsplash.com/photo-1590156206657-b89d3d922a61?q=80&w=1200&auto=format&fit=crop',
  alt: 'Luxury beauty texture',
  quote: '"Beauty is an attitude."',
  attribution: 'The Beautify Africa Philosophy',
};

export const FORM_FIELDS = {
  email: {
    id: 'auth-email',
    type: 'email',
    label: 'Email Address',
    placeholder: 'Email',
    autoComplete: 'email',
  },
  password: {
    id: 'auth-password',
    type: 'password',
    label: 'Password',
    placeholder: 'Password',
    autoComplete: 'current-password',
  },
};

export const LEGAL_LINKS = {
  terms: { label: 'Terms of Service', href: '/terms' },
  privacy: { label: 'Privacy Policy', href: '/privacy' },
};
