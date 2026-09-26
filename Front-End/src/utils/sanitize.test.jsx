import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { sanitizeUrl, escapeHtml, sanitizeText } from './sanitize';
import AppLink from '@/Components/Shared/AppLink';

describe('Frontend Security & XSS Prevention Suite', () => {
  describe('sanitizeUrl', () => {
    it('neutralizes javascript: pseudo-protocol attacks', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBe('#');
      expect(sanitizeUrl('JAVASCRIPT:alert("XSS")')).toBe('#');
      expect(sanitizeUrl('javascript://alert(1)')).toBe('#');
      expect(sanitizeUrl('java\0script:alert(1)')).toBe('#');
      expect(sanitizeUrl('  javascript:void(0) ')).toBe('#');
    });

    it('neutralizes vbscript and data: HTML attacks', () => {
      expect(sanitizeUrl('vbscript:msgbox(1)')).toBe('#');
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('#');
    });

    it('permits legitimate relative, anchor, and query paths', () => {
      expect(sanitizeUrl('/shop')).toBe('/shop');
      expect(sanitizeUrl('/products/african-shea-butter')).toBe('/products/african-shea-butter');
      expect(sanitizeUrl('#reviews')).toBe('#reviews');
      expect(sanitizeUrl('?category=skincare')).toBe('?category=skincare');
    });

    it('permits legitimate external URLs with approved protocols', () => {
      expect(sanitizeUrl('https://beautifyafrica.app')).toBe('https://beautifyafrica.app');
      expect(sanitizeUrl('http://localhost:5000/api')).toBe('http://localhost:5000/api');
      expect(sanitizeUrl('mailto:support@beautifyafrica.app')).toBe('mailto:support@beautifyafrica.app');
      expect(sanitizeUrl('tel:+254700000000')).toBe('tel:+254700000000');
    });

    it('uses custom fallback when supplied', () => {
      expect(sanitizeUrl('javascript:bad()', '/safe-fallback')).toBe('/safe-fallback');
    });
  });

  describe('escapeHtml', () => {
    it('escapes dangerous HTML characters', () => {
      const raw = '<script>alert("XSS" & \'test\')</script>';
      const escaped = escapeHtml(raw);
      expect(escaped).not.toContain('<script>');
      expect(escaped).toContain('&lt;script&gt;');
      expect(escaped).toContain('&amp;');
      expect(escaped).toContain('&quot;');
      expect(escaped).toContain('&#x27;');
    });

    it('returns empty string for null or non-string input', () => {
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
    });
  });

  describe('sanitizeText', () => {
    it('strips script tags and event handlers', () => {
      const dirty = 'Hello <script>alert(1)</script> world <img src="x" onerror="alert(2)">';
      const clean = sanitizeText(dirty);
      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('onerror');
      expect(clean).toContain('Hello  world');
    });
  });

  describe('AppLink Component Security', () => {
    it('neutralizes malicious javascript: href in rendered anchor', () => {
      render(
        <MemoryRouter>
          <AppLink href="javascript:alert('pwned')">Attack Link</AppLink>
        </MemoryRouter>
      );

      const link = screen.getByText('Attack Link');
      expect(link.getAttribute('href')).toBe('#');
    });

    it('renders safe external links with noopener noreferrer', () => {
      render(
        <MemoryRouter>
          <AppLink href="https://instagram.com/beautifyafrica" target="_blank">
            Instagram
          </AppLink>
        </MemoryRouter>
      );

      const link = screen.getByText('Instagram');
      expect(link.getAttribute('href')).toBe('https://instagram.com/beautifyafrica');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    });

    it('renders safe internal links via React Router', () => {
      render(
        <MemoryRouter>
          <AppLink href="/shop">Shop Now</AppLink>
        </MemoryRouter>
      );

      const link = screen.getByText('Shop Now');
      expect(link.getAttribute('href')).toBe('/shop');
    });
  });

  describe('Bundle Secret Leak Scanner Rules', () => {
    const SENSITIVE_CONTENT_PATTERNS = [
      /sk_live_[0-9a-zA-Z]{24,}/,
      /sk_test_[0-9a-zA-Z]{24,}/,
      /whsec_[0-9a-zA-Z]{24,}/,
      /-----BEGIN (?:RSA|EC|OPENSSH|PGP|PRIVATE) KEY-----/,
      /postgres:\/\/[^:]+:[^@]+@/,
      /redis:\/\/:[^@]+@/,
    ];

    it('matches and flags live Stripe secret keys', () => {
      const mockSecret = 'const key = "' + 'sk_' + 'live_' + '51AbcDefGhIjKlMnOpQrStUvWxYz0123456";';
      const matched = SENSITIVE_CONTENT_PATTERNS.some((p) => p.test(mockSecret));
      expect(matched).toBe(true);
    });

    it('matches and flags raw database URLs with credentials', () => {
      const mockDbUrl = 'const db = "postgres://postgres:super_secret_pw@db.cloud.io:5432/main";';
      const matched = SENSITIVE_CONTENT_PATTERNS.some((p) => p.test(mockDbUrl));
      expect(matched).toBe(true);
    });

    it('permits public client keys like Stripe publishable key', () => {
      const mockPublishable = 'const pk = "pk_test_51AbcDefGhIjKlMnOpQrStUvWxYz0123456";';
      const matched = SENSITIVE_CONTENT_PATTERNS.some((p) => p.test(mockPublishable));
      expect(matched).toBe(false);
    });
  });
});
