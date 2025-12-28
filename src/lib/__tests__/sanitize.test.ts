/**
 * Tests for sanitization utilities
 * Ensures XSS prevention measures work correctly
 */

import { describe, it, expect } from 'vitest';
import { sanitizeHtml, validateImageUrl, sanitizeUrlInput, ALLOWED_IMAGE_DOMAINS } from '../sanitize';

describe('sanitizeHtml', () => {
  it('should encode HTML special characters', () => {
    const input = '<script>alert("xss")</script>';
    const output = sanitizeHtml(input);
    expect(output).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
  });

  it('should handle empty strings', () => {
    expect(sanitizeHtml('')).toBe('');
  });

  it('should handle null/undefined gracefully', () => {
    expect(sanitizeHtml(null as any)).toBe('');
    expect(sanitizeHtml(undefined as any)).toBe('');
  });

  it('should encode all dangerous characters', () => {
    const input = `&<>"'\`=/`;
    const output = sanitizeHtml(input);
    expect(output).toBe('&amp;&lt;&gt;&quot;&#39;&#x60;&#x3D;&#x2F;');
  });
});

describe('validateImageUrl', () => {
  it('should allow whitelisted domains', () => {
    const url = 'https://cdn.simpleicons.org/react';
    expect(validateImageUrl(url)).toBe(url);
  });

  it('should allow subdomains of whitelisted domains', () => {
    const url = 'https://api.cdn.simpleicons.org/react';
    expect(validateImageUrl(url)).toBe(url);
  });

  it('should block javascript: protocol', () => {
    const url = 'javascript:alert(1)';
    expect(validateImageUrl(url)).toBeNull();
  });

  it('should block data: protocol', () => {
    const url = 'data:text/html,<script>alert(1)</script>';
    expect(validateImageUrl(url)).toBeNull();
  });

  it('should block non-whitelisted domains', () => {
    const url = 'https://evil.com/malicious.jpg';
    expect(validateImageUrl(url)).toBeNull();
  });

  it('should allow relative paths', () => {
    const url = '/images/logo.png';
    expect(validateImageUrl(url)).toBe(url);
  });

  it('should handle invalid URLs gracefully', () => {
    const url = 'not-a-valid-url';
    expect(validateImageUrl(url)).toBeNull();
  });

  it('should allow Brandfetch CDN', () => {
    const url = 'https://cdn.brandfetch.io/example.com/w/64/h/64';
    expect(validateImageUrl(url)).toBe(url);
  });

  it('should allow Supabase domains', () => {
    const url = 'https://supabase.com/favicon.png';
    expect(validateImageUrl(url)).toBe(url);
  });

  it('should block vbscript protocol', () => {
    const url = 'vbscript:msgbox(1)';
    expect(validateImageUrl(url)).toBeNull();
  });

  it('should block file protocol', () => {
    const url = 'file:///etc/passwd';
    expect(validateImageUrl(url)).toBeNull();
  });
});

describe('sanitizeUrlInput', () => {
  it('should remove dangerous characters', () => {
    const input = '"><script>alert(1)</script>';
    const output = sanitizeUrlInput(input);
    expect(output).not.toContain('<');
    expect(output).not.toContain('>');
    expect(output).not.toContain('"');
  });

  it('should preserve safe characters', () => {
    const input = 'my-app-name';
    expect(sanitizeUrlInput(input)).toBe('my-app-name');
  });

  it('should limit length', () => {
    const input = 'a'.repeat(1000);
    const output = sanitizeUrlInput(input);
    expect(output.length).toBeLessThanOrEqual(500);
  });
});

describe('ALLOWED_IMAGE_DOMAINS', () => {
  it('should include common CDN domains', () => {
    expect(ALLOWED_IMAGE_DOMAINS).toContain('cdn.simpleicons.org');
    expect(ALLOWED_IMAGE_DOMAINS).toContain('cdn.brandfetch.io');
  });

  it('should include internal domains', () => {
    expect(ALLOWED_IMAGE_DOMAINS).toContain('localhost');
    expect(ALLOWED_IMAGE_DOMAINS).toContain('specificity.ai');
  });
});
