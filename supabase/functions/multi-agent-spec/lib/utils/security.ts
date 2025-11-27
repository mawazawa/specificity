/**
 * Security utilities for the multi-agent-spec function
 */

// Prompt injection detection
export const detectPromptInjection = (input: string): boolean => {
  const suspiciousPatterns = [
    /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|commands?)/i,
    /system\s+(prompt|message|instruction)/i,
    /(api|secret|private)\s*key/i,
    /reveal\s+(secrets?|credentials?|keys?)/i,
    /(output|show|display|print|return)\s+(your|the)\s+(prompt|instructions?|system)/i,
    /you\s+are\s+now/i,
    /new\s+instructions?:/i,
    /reset\s+context/i,
  ];
  return suspiciousPatterns.some(pattern => pattern.test(input));
};

// Enhanced input sanitization
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>"'`]/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[\u202A-\u202E]/g, '')
    .normalize('NFKC')
    .slice(0, 2000)
    .trim();
};

// Utility: Sanitize errors for logging
export const sanitizeError = (error: unknown) => {
  if (error instanceof Error) {
    return { message: error.message, name: error.name };
  }
  return { message: 'Unknown error' };
};
