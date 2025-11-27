/* eslint-disable @typescript-eslint/no-explicit-any */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Validation schema
const audioRequestSchema = z.object({
  audio: z.string()
    .min(100, 'Audio data too short')
    .regex(/^[A-Za-z0-9+/=]+$/, 'Invalid audio format - must be base64'),
});

// Utility: Sanitize errors for logging
const sanitizeError = (error: any) => {
  if (error instanceof Error) {
    return { message: error.message, name: error.name };
  }
  return { message: 'Unknown error' };
};

// Utility: Get user-friendly error message
const getUserMessage = (error: any): string => {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('audio') || message.includes('Audio')) {
    return 'Invalid audio format. Please try recording again.';
  }
  if (message.includes('RATE_LIMIT') || message.includes('rate limit')) {
    return 'Rate limit exceeded. Please try again in an hour.';
  }
  if (message.includes('API') || message.includes('api')) {
    return 'Transcription service error. Please try again.';
  }
  return 'An unexpected error occurred. Please try again.';
};

// Validate audio file format by magic bytes
function validateAudioBlob(binaryData: Uint8Array): { valid: boolean; format?: string; error?: string } {
  const magic = binaryData.slice(0, 12);

  // WebM: 0x1A 0x45 0xDF 0xA3
  if (magic[0] === 0x1A && magic[1] === 0x45 && magic[2] === 0xDF && magic[3] === 0xA3) {
    return { valid: true, format: 'webm' };
  }

  // WAV: 'RIFF' ... 'WAVE'
  if (magic[0] === 0x52 && magic[1] === 0x49 && magic[2] === 0x46 && magic[3] === 0x46 &&
    magic[8] === 0x57 && magic[9] === 0x41 && magic[10] === 0x56 && magic[11] === 0x45) {
    return { valid: true, format: 'wav' };
  }

  // MP3: 0xFF 0xFB or ID3
  if ((magic[0] === 0xFF && (magic[1] & 0xE0) === 0xE0) ||
    (magic[0] === 0x49 && magic[1] === 0x44 && magic[2] === 0x33)) {
    return { valid: true, format: 'mp3' };
  }

  // OGG: 'OggS'
  if (magic[0] === 0x4F && magic[1] === 0x67 && magic[2] === 0x67 && magic[3] === 0x53) {
    return { valid: true, format: 'ogg' };
  }

  return { valid: false, error: 'Invalid audio format. Supported: WebM, WAV, MP3, OGG' };
}

// Atomic rate limiting function
async function checkRateLimit(userId: string, endpoint: string, maxRequests: number = 5): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  try {
    const { data, error } = await supabase.rpc('check_and_increment_rate_limit', {
      p_user_id: userId,
      p_endpoint: endpoint,
      p_max_requests: maxRequests,
      p_window_start_cutoff: oneHourAgo
    });

    if (error) {
      console.error('Rate limit error:', { type: 'rate_limit_error', user_id: userId });
      return { allowed: false, remaining: 0 };
    }

    return {
      allowed: data.allowed,
      remaining: data.remaining
    };
  } catch (error) {
    console.error('Rate limit exception:', { type: 'rate_limit_exception', user_id: userId });
    return { allowed: false, remaining: 0 };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify authentication and extract user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract and validate user from JWT
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit (5 requests per hour per user)
    const rateLimit = await checkRateLimit(user.id, 'voice-to-text', 5);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded. You can transcribe up to 5 audio clips per hour. Please try again later.',
          retryAfter: 3600
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + 60 * 60 * 1000).toISOString()
          }
        }
      );
    }

    const rawBody = await req.json();

    // Validate request
    let validated;
    try {
      validated = audioRequestSchema.parse(rawBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Validation failed:', { type: 'validation_error', user_id: user.id });
        return new Response(
          JSON.stringify({ error: 'Invalid audio format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw error;
    }

    const { audio } = validated;

    // Validate audio size (max 10MB)
    const sizeEstimate = (audio.length * 3) / 4;
    if (sizeEstimate > 10 * 1024 * 1024) {
      throw new Error('Audio file too large (max 10MB)');
    }

    // Convert base64 to binary
    const binaryAudio = Uint8Array.from(atob(audio), c => c.charCodeAt(0));

    // Validate audio format by magic bytes
    const validation = validateAudioBlob(binaryAudio);
    if (!validation.valid) {
      console.warn('Invalid audio format:', { type: 'invalid_format', user_id: user.id });
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // MIME type mapping
    const mimeTypes: Record<string, string> = {
      webm: 'audio/webm',
      wav: 'audio/wav',
      mp3: 'audio/mpeg',
      ogg: 'audio/ogg'
    };

    // Create form data with correct MIME type
    const formData = new FormData();
    const blob = new Blob([binaryAudio], { type: mimeTypes[validation.format!] });
    const extension = validation.format === 'mp3' ? 'mp3' : validation.format === 'wav' ? 'wav' : validation.format === 'ogg' ? 'ogg' : 'webm';
    formData.append('file', blob, `audio.${extension}`);
    formData.append('model', 'whisper-large-v3-turbo');
    formData.append('language', 'en');
    formData.append('response_format', 'json');

    // Send to Groq API
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('GROQ_API_KEY')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      console.error('Transcription error:', { type: 'api_error', status: response.status, user_id: user.id });

      if (response.status === 429) {
        throw new Error('RATE_LIMIT: External API rate limit');
      }

      throw new Error('API request failed');
    }

    const result = await response.json();

    return new Response(
      JSON.stringify({
        text: result.text,
        remaining: rateLimit.remaining
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Service error:', { type: 'transcription_error' });
    return new Response(
      JSON.stringify({ error: getUserMessage(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});