import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    return 'Service temporarily unavailable. Please try again shortly.';
  }
  if (message.includes('API') || message.includes('api')) {
    return 'Transcription service error. Please try again.';
  }
  return 'An unexpected error occurred. Please try again.';
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { audio } = await req.json();
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    // Convert base64 to binary
    const binaryAudio = Uint8Array.from(atob(audio), c => c.charCodeAt(0));
    
    // Create form data
    const formData = new FormData();
    const blob = new Blob([binaryAudio], { type: 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
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
      console.error('Transcription API error:', sanitizeError(new Error('API request failed')));
      throw new Error('API request failed');
    }

    const result = await response.json();

    return new Response(
      JSON.stringify({ text: result.text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Voice-to-text error:', sanitizeError(error));
    return new Response(
      JSON.stringify({ error: getUserMessage(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
