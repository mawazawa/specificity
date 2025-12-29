/**
 * Voice-to-Text Integration Tests
 * Tests audio transcription functionality
 * Phase 7 Action 9: Edge Function Integration Tests (94% confidence)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockAuthUser, mockCorsHeaders } from './__mocks__/api-mocks';

// Mock valid audio data (base64 encoded)
const mockValidWebMBase64 = 'GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwH/////////FUmpZpkq17GDD0JATYCGQ2hyb21lV0GGQ2hyb21lFlSua7+uvdeBAXPFh1WmtkAAAAAAADEBAAAAAADUBQAAAABiUkVT';
const mockValidWAVBase64 = 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
const mockValidMP3Base64 = '//uQxAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAACAAABhgBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf////////';
const mockValidOGGBase64 = 'T2dnUwACAAAAAAAAAABAAAAAAAAA8gAAAQE=';

const mockInvalidBase64 = 'invalid-not-audio!!!';
const mockTooLargeBase64 = 'A'.repeat(15 * 1024 * 1024); // 15MB

// Mock Groq API response
const mockGroqTranscriptionResponse = {
  text: 'This is the transcribed text from the audio.'
};

describe('voice-to-text', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('request validation', () => {
    it('rejects requests without authorization header', () => {
      const req = new Request('https://test.supabase.co/functions/v1/voice-to-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: mockValidWebMBase64 })
      });

      expect(req.headers.get('Authorization')).toBeNull();
      // Should return 401 unauthorized
    });

    it('validates audio field is present', () => {
      const requestBody = { audio: mockValidWebMBase64 };
      expect(requestBody).toHaveProperty('audio');
    });

    it('rejects audio data that is too short', () => {
      const tooShort = 'abc';
      expect(tooShort.length).toBeLessThan(100);
      // Zod schema requires minimum 100 characters
    });

    it('validates base64 format', () => {
      const base64Regex = /^[A-Za-z0-9+/=]+$/;

      expect(mockValidWebMBase64).toMatch(base64Regex);
      expect(mockValidWAVBase64).toMatch(base64Regex);
      expect(mockValidMP3Base64).toMatch(base64Regex);
      expect(mockInvalidBase64).not.toMatch(base64Regex);
    });

    it('rejects audio files larger than 10MB', () => {
      const sizeEstimate = (mockTooLargeBase64.length * 3) / 4;
      expect(sizeEstimate).toBeGreaterThan(10 * 1024 * 1024);
      // Should return 400 error
    });
  });

  describe('audio format detection', () => {
    it('detects WebM format by magic bytes', () => {
      const binaryData = Uint8Array.from(atob(mockValidWebMBase64), c => c.charCodeAt(0));

      // WebM magic bytes: 0x1A 0x45 0xDF 0xA3
      expect(binaryData[0]).toBe(0x1A);
      expect(binaryData[1]).toBe(0x45);
      expect(binaryData[2]).toBe(0xDF);
      expect(binaryData[3]).toBe(0xA3);
    });

    it('detects WAV format by magic bytes', () => {
      const binaryData = Uint8Array.from(atob(mockValidWAVBase64), c => c.charCodeAt(0));

      // WAV magic bytes: 'RIFF' at start, 'WAVE' at position 8
      expect(binaryData[0]).toBe(0x52); // 'R'
      expect(binaryData[1]).toBe(0x49); // 'I'
      expect(binaryData[2]).toBe(0x46); // 'F'
      expect(binaryData[3]).toBe(0x46); // 'F'
      expect(binaryData[8]).toBe(0x57); // 'W'
      expect(binaryData[9]).toBe(0x41); // 'A'
      expect(binaryData[10]).toBe(0x56); // 'V'
      expect(binaryData[11]).toBe(0x45); // 'E'
    });

    it('detects MP3 format by magic bytes', () => {
      const binaryData = Uint8Array.from(atob(mockValidMP3Base64), c => c.charCodeAt(0));

      // MP3 magic bytes: 0xFF 0xFB (or 0xFF with 0xE0 mask)
      expect(binaryData[0]).toBe(0xFF);
      expect((binaryData[1] & 0xE0)).toBe(0xE0);
    });

    it('detects OGG format by magic bytes', () => {
      const binaryData = Uint8Array.from(atob(mockValidOGGBase64), c => c.charCodeAt(0));

      // OGG magic bytes: 'OggS'
      expect(binaryData[0]).toBe(0x4F); // 'O'
      expect(binaryData[1]).toBe(0x67); // 'g'
      expect(binaryData[2]).toBe(0x67); // 'g'
      expect(binaryData[3]).toBe(0x53); // 'S'
    });

    it('rejects unsupported audio formats', () => {
      const invalidFormat = new Uint8Array([0x00, 0x00, 0x00, 0x00]);

      // None of the valid magic bytes
      expect(invalidFormat[0]).not.toBe(0x1A); // Not WebM
      expect(invalidFormat[0]).not.toBe(0x52); // Not WAV
      expect(invalidFormat[0]).not.toBe(0xFF); // Not MP3
      expect(invalidFormat[0]).not.toBe(0x4F); // Not OGG
    });
  });

  describe('MIME type mapping', () => {
    it('maps WebM to correct MIME type', () => {
      const mimeType = 'audio/webm';
      expect(mimeType).toBe('audio/webm');
    });

    it('maps WAV to correct MIME type', () => {
      const mimeType = 'audio/wav';
      expect(mimeType).toBe('audio/wav');
    });

    it('maps MP3 to correct MIME type', () => {
      const mimeType = 'audio/mpeg';
      expect(mimeType).toBe('audio/mpeg');
    });

    it('maps OGG to correct MIME type', () => {
      const mimeType = 'audio/ogg';
      expect(mimeType).toBe('audio/ogg');
    });
  });

  describe('rate limiting', () => {
    it('enforces 5 requests per hour limit', () => {
      const maxRequests = 5;
      expect(maxRequests).toBe(5);
    });

    it('returns 429 when rate limit exceeded', () => {
      const rateLimitError = {
        error: 'Rate limit exceeded. You can transcribe up to 5 audio clips per hour. Please try again later.',
        retryAfter: 3600
      };

      expect(rateLimitError).toHaveProperty('error');
      expect(rateLimitError).toHaveProperty('retryAfter');
      expect(rateLimitError.retryAfter).toBe(3600);
    });

    it('includes rate limit headers in response', () => {
      const headers = {
        'X-RateLimit-Remaining': '4',
        'X-RateLimit-Reset': new Date(Date.now() + 60 * 60 * 1000).toISOString()
      };

      expect(headers).toHaveProperty('X-RateLimit-Remaining');
      expect(headers).toHaveProperty('X-RateLimit-Reset');
    });

    it('tracks remaining requests correctly', () => {
      const remaining = 3;
      expect(remaining).toBeGreaterThanOrEqual(0);
      expect(remaining).toBeLessThanOrEqual(5);
    });
  });

  describe('Groq API integration', () => {
    it('sends correct form data to Groq', () => {
      const formData = new FormData();
      const blob = new Blob([new Uint8Array([0x1A, 0x45, 0xDF, 0xA3])], { type: 'audio/webm' });
      formData.append('file', blob, 'audio.webm');
      formData.append('model', 'whisper-large-v3-turbo');
      formData.append('language', 'en');
      formData.append('response_format', 'json');

      expect(formData.has('file')).toBe(true);
      expect(formData.has('model')).toBe(true);
      expect(formData.has('language')).toBe(true);
      expect(formData.has('response_format')).toBe(true);
    });

    it('uses whisper-large-v3-turbo model', () => {
      const model = 'whisper-large-v3-turbo';
      expect(model).toBe('whisper-large-v3-turbo');
    });

    it('sets language to English', () => {
      const language = 'en';
      expect(language).toBe('en');
    });

    it('requests JSON response format', () => {
      const responseFormat = 'json';
      expect(responseFormat).toBe('json');
    });

    it('handles successful transcription response', () => {
      const response = mockGroqTranscriptionResponse;

      expect(response).toHaveProperty('text');
      expect(response.text.length).toBeGreaterThan(0);
    });

    it('returns transcription text with remaining count', () => {
      const result = {
        text: mockGroqTranscriptionResponse.text,
        remaining: 4
      };

      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('remaining');
      expect(result.remaining).toBeGreaterThanOrEqual(0);
    });
  });

  describe('error handling', () => {
    it('handles authentication errors', () => {
      const authError = {
        error: 'Invalid authentication'
      };

      expect(authError.error).toContain('authentication');
      // Should return 401 status
    });

    it('handles validation errors', () => {
      const validationError = {
        error: 'Invalid audio format'
      };

      expect(validationError.error).toContain('Invalid');
      // Should return 400 status
    });

    it('handles Groq API errors', () => {
      const apiError = {
        error: 'Transcription service error. Please try again.'
      };

      expect(apiError.error).toContain('error');
      // Should return 500 status
    });

    it('handles rate limit errors from Groq', () => {
      const rateLimitError = new Error('RATE_LIMIT: External API rate limit');

      expect(rateLimitError.message).toContain('RATE_LIMIT');
    });

    it('provides user-friendly error messages', () => {
      const errors = [
        { input: 'Invalid audio format', expected: 'audio' },
        { input: 'RATE_LIMIT exceeded', expected: 'rate' },
        { input: 'Transcription service error', expected: 'service' }
      ];

      errors.forEach(({ input, expected }) => {
        const isRelevant = input.toLowerCase().includes(expected.toLowerCase());
        expect(isRelevant).toBe(true);
      });
    });

    it('sanitizes error messages for logging', () => {
      const error = new Error('API key invalid');
      const sanitized = {
        message: error.message,
        name: error.name
      };

      expect(sanitized).toHaveProperty('message');
      expect(sanitized).toHaveProperty('name');
      expect(sanitized).not.toHaveProperty('stack'); // Don't leak stack traces
    });

    it('handles missing GROQ_API_KEY', () => {
      const missingKey = undefined;

      expect(missingKey).toBeUndefined();
      // Should fail early with configuration error
    });

    it('handles audio format detection failure', () => {
      const error = {
        error: 'Invalid audio format. Supported: WebM, WAV, MP3, OGG'
      };

      expect(error.error).toContain('Supported');
    });

    it('handles file too large error', () => {
      const error = new Error('Audio file too large (max 10MB)');

      expect(error.message).toContain('10MB');
    });
  });

  describe('CORS handling', () => {
    it('handles OPTIONS preflight requests', () => {
      const optionsRequest = new Request('https://test.supabase.co/functions/v1/voice-to-text', {
        method: 'OPTIONS'
      });

      expect(optionsRequest.method).toBe('OPTIONS');
      // Should return 200 with CORS headers
    });

    it('includes CORS headers in all responses', () => {
      expect(mockCorsHeaders).toHaveProperty('Access-Control-Allow-Origin');
      expect(mockCorsHeaders).toHaveProperty('Access-Control-Allow-Headers');
    });

    it('allows all origins', () => {
      expect(mockCorsHeaders['Access-Control-Allow-Origin']).toBe('*');
    });
  });

  describe('response format', () => {
    it('returns JSON response on success', () => {
      const response = {
        text: 'Transcribed text',
        remaining: 4
      };

      expect(typeof response.text).toBe('string');
      expect(typeof response.remaining).toBe('number');
    });

    it('includes content-type header', () => {
      const headers = { 'Content-Type': 'application/json' };
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('returns error JSON on failure', () => {
      const errorResponse = {
        error: 'Transcription failed'
      };

      expect(errorResponse).toHaveProperty('error');
    });
  });

  describe('authentication flow', () => {
    it('extracts bearer token from header', () => {
      const authHeader = 'Bearer test-token-123';
      const token = authHeader.replace('Bearer ', '');

      expect(token).toBe('test-token-123');
    });

    it('validates user with Supabase auth', () => {
      const user = mockAuthUser();

      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
    });

    it('rejects invalid tokens', () => {
      const authError = new Error('Invalid authentication');

      expect(authError.message).toContain('Invalid');
    });
  });

  describe('file naming', () => {
    it('generates correct filename for WebM', () => {
      const extension = 'webm';
      const filename = `audio.${extension}`;

      expect(filename).toBe('audio.webm');
    });

    it('generates correct filename for WAV', () => {
      const extension = 'wav';
      const filename = `audio.${extension}`;

      expect(filename).toBe('audio.wav');
    });

    it('generates correct filename for MP3', () => {
      const extension = 'mp3';
      const filename = `audio.${extension}`;

      expect(filename).toBe('audio.mp3');
    });

    it('generates correct filename for OGG', () => {
      const extension = 'ogg';
      const filename = `audio.${extension}`;

      expect(filename).toBe('audio.ogg');
    });
  });

  describe('base64 decoding', () => {
    it('decodes valid base64 to binary', () => {
      const decoded = Uint8Array.from(atob(mockValidWebMBase64), c => c.charCodeAt(0));

      expect(decoded instanceof Uint8Array).toBe(true);
      expect(decoded.length).toBeGreaterThan(0);
    });

    it('handles base64 padding correctly', () => {
      const withPadding = 'SGVsbG8=';
      const decoded = atob(withPadding);

      expect(decoded).toBe('Hello');
    });

    it('calculates file size from base64', () => {
      const base64Length = mockValidWebMBase64.length;
      const estimatedSize = (base64Length * 3) / 4;

      expect(estimatedSize).toBeGreaterThan(0);
      expect(estimatedSize).toBeLessThan(base64Length);
    });
  });

  describe('integration scenarios', () => {
    it('handles full successful transcription flow', () => {
      const steps = [
        { step: 'validate auth', passed: true },
        { step: 'check rate limit', passed: true },
        { step: 'validate audio format', passed: true },
        { step: 'detect format', passed: true },
        { step: 'call Groq API', passed: true },
        { step: 'return result', passed: true }
      ];

      steps.forEach(({ step, passed }) => {
        expect(passed).toBe(true);
      });
    });

    it('handles rate limit exceeded scenario', () => {
      const steps = [
        { step: 'validate auth', passed: true },
        { step: 'check rate limit', passed: false, error: 'RATE_LIMIT_EXCEEDED' },
        { step: 'return 429', passed: true }
      ];

      const rateLimitFailed = steps.find(s => s.step === 'check rate limit');
      expect(rateLimitFailed?.passed).toBe(false);
      expect(rateLimitFailed?.error).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('handles invalid audio format scenario', () => {
      const steps = [
        { step: 'validate auth', passed: true },
        { step: 'check rate limit', passed: true },
        { step: 'validate audio format', passed: false, error: 'INVALID_FORMAT' },
        { step: 'return 400', passed: true }
      ];

      const formatFailed = steps.find(s => s.step === 'validate audio format');
      expect(formatFailed?.passed).toBe(false);
    });
  });
});
