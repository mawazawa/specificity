/**
 * Security Sanitization Utilities
 *
 * Provides HTML entity encoding and URL validation to prevent XSS attacks.
 * Created as part of Action 43: Fix XSS Vulnerability Patterns
 */

import { logger } from '@/lib/logger';

/**
 * Allowed image domains whitelist
 * Only images from these domains will be loaded to prevent XSS via image URLs
 */
export const ALLOWED_IMAGE_DOMAINS = [
  // Brand/Logo CDNs
  'cdn.simpleicons.org',
  'cdn.brandfetch.io',
  'brandfetch.com',

  // Technology logos
  'supabase.com',
  'www.gstatic.com',
  'docs.amplify.aws',
  'cdn.oaistatic.com',
  'www.anthropic.com',

  // Internal/relative paths
  'localhost',
  'specificity.ai',

  // Lovable/deployment CDNs
  'lovable.dev',
  'images.unsplash.com',
  'cdn.jsdelivr.net',
  'unpkg.com',
];

/**
 * Sanitize HTML by encoding special characters
 * Prevents XSS by converting HTML entities to their encoded equivalents
 *
 * @param html - Raw HTML string that may contain malicious code
 * @returns Sanitized string with HTML entities encoded
 *
 * @example
 * ```ts
 * sanitizeHtml('<script>alert("xss")</script>')
 * // Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 * ```
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  const entityMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };

  return html.replace(/[&<>"'`=/]/g, (char) => entityMap[char] || char);
}

/**
 * Validate image URL against whitelist of allowed domains
 * Prevents XSS via malicious URLs (javascript:, data:, etc.)
 *
 * @param url - Image URL to validate
 * @returns Validated URL if safe, null if potentially malicious
 *
 * @example
 * ```ts
 * validateImageUrl('https://cdn.simpleicons.org/react')
 * // Returns: 'https://cdn.simpleicons.org/react'
 *
 * validateImageUrl('javascript:alert(1)')
 * // Returns: null
 * ```
 */
export function validateImageUrl(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Trim whitespace
  url = url.trim();

  // Allow relative paths (starting with /)
  if (url.startsWith('/')) {
    return url;
  }

  // Block dangerous protocols
  const dangerousProtocols = [
    'javascript:',
    'data:',
    'vbscript:',
    'file:',
    'about:',
  ];

  const lowerUrl = url.toLowerCase();
  if (dangerousProtocols.some(protocol => lowerUrl.startsWith(protocol))) {
    logger.warn(`[Security] Blocked dangerous URL protocol: ${url}`);
    return null;
  }

  try {
    // Parse URL to extract domain
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Check if domain is in whitelist
    const isAllowed = ALLOWED_IMAGE_DOMAINS.some(domain => {
      // Exact match or subdomain match
      return hostname === domain || hostname.endsWith(`.${domain}`);
    });

    if (!isAllowed) {
      logger.warn(`[Security] Blocked image URL from non-whitelisted domain: ${hostname}`);
      return null;
    }

    // Additional check: ensure it's HTTP or HTTPS
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      logger.warn(`[Security] Blocked non-HTTP(S) URL: ${url}`);
      return null;
    }

    return url;
  } catch (error) {
    // Invalid URL format
    logger.warn(`[Security] Invalid URL format: ${url}`, error);
    return null;
  }
}

/**
 * Sanitize and validate user input for use in URLs
 * Removes dangerous characters that could break out of URL context
 *
 * @param input - User input to sanitize
 * @returns Sanitized string safe for URL construction
 *
 * @example
 * ```ts
 * sanitizeUrlInput('my-app'); // Returns: 'my-app'
 * sanitizeUrlInput('"><script>'); // Returns: 'script'
 * ```
 */
export function sanitizeUrlInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove dangerous characters
  return input
    .replace(/[<>"'`\\;(){}[\]]/g, '')
    .trim()
    .substring(0, 500); // Limit length to prevent DoS
}
