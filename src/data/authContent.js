/**
 * Auth Modal content configuration
 * Centralized data for the AuthModal component
 */
import authImage from '../../assets/Auth.jpg';

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
  src: authImage,
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
