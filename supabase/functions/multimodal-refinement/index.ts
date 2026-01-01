/* eslint-disable @typescript-eslint/no-explicit-any */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';
import { callOpenRouter, retryWithBackoff, ContentPart, LLMCallParams } from '../lib/openrouter-client.ts';
import { checkRateLimit, checkSubscription, corsHeaders } from '../multi-agent-spec/lib/utils/api.ts';
import { detectPromptInjection, sanitizeError } from '../multi-agent-spec/lib/utils/security.ts';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const VISION_MODEL_PRIMARY = 'gemini-3-flash';
const VISION_MODEL_FALLBACK = 'claude-opus-4.5';
const REFINEMENT_MODEL = 'groq-llama-3.3-70b';

const VISION_SYSTEM_PROMPT = `You are a senior UX/UI analyst and technical architect.
Analyze the provided image (wireframe, mockup, or design) in the context of a software specification.

Your analysis MUST include:

1. **Visual Elements Identified**
   - UI components (buttons, forms, navigation, modals)
   - Layout structure (grid, hierarchy, spacing)
   - Data visualization elements
   - User interaction patterns

2. **Specification Alignment**
   - Features visible in design vs. mentioned in spec
   - Missing specification details visible in design
   - Contradictions between design and spec

3. **Gap Analysis**
   - UI states not covered (loading, error, empty)
   - Edge cases visible but unspecified
   - Responsive behavior implications
   - Accessibility considerations

4. **Technical Implications**
   - Component architecture suggestions
   - State management requirements
   - API/data requirements from UI

Output JSON with this exact structure:
{
  "imageInsights": "Detailed description of what you see",
  "alignmentScore": 0-100,
  "gaps": ["gap1", "gap2", ...],
  "suggestions": ["suggestion1", "suggestion2", ...],
  "detectedComponents": ["component1", "component2", ...],
  "technicalRequirements": ["req1", "req2", ...]
}`;

const REFINEMENT_SYSTEM_PROMPT = `You are a technical specification writer.
Given visual analysis insights and an existing specification, produce a refined specification that:
1. Incorporates UI details discovered in the image
2. Addresses identified gaps
3. Maintains consistency with existing content
4. Adds technical requirements implied by the visual design

Output the complete refined specification in markdown format.`;

// ═══════════════════════════════════════════════════════════════
// ZOD SCHEMA
// ═══════════════════════════════════════════════════════════════

const multimodalRefinementSchema = z.object({
  image: z.string()
    .min(1, 'Image is required')
    .refine(
      (val) => {
        if (val.startsWith('data:image/')) {
          return /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(val);
        }
        if (val.startsWith('http://') || val.startsWith('https://')) {
          try {
            new URL(val);
            return true;
          } catch {
            return false;
          }
        }
        return false;
      },
      { message: 'Invalid image format. Provide base64 data URI or valid URL' }
    ),
  specContent: z.string()
    .min(1, 'Specification content is required')
    .max(50000, 'Specification content exceeds 50,000 character limit'),
  focusArea: z.enum(['ui_ux', 'architecture', 'features', 'comprehensive'])
    .default('comprehensive'),
  imageDescription: z.string()
    .max(500, 'Image description too long')
    .optional(),
  additionalContext: z.string()
    .max(2000, 'Additional context too long')
    .optional()
});

type MultimodalRefinementRequest = z.infer<typeof multimodalRefinementSchema>;

// ═══════════════════════════════════════════════════════════════
// IMAGE VALIDATION
// ═══════════════════════════════════════════════════════════════

interface ImageValidation {
  valid: boolean;
  format?: 'png' | 'jpeg' | 'webp' | 'gif';
  sizeBytes?: number;
  error?: string;
}

function validateImageBlob(binaryData: Uint8Array): ImageValidation {
  // Size check (max 10MB)
  if (binaryData.length > 10 * 1024 * 1024) {
    return { valid: false, error: 'IMAGE_TOO_LARGE: Image exceeds 10MB limit' };
  }

  const magic = binaryData.slice(0, 12);

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (magic[0] === 0x89 && magic[1] === 0x50 && magic[2] === 0x4E && magic[3] === 0x47 &&
      magic[4] === 0x0D && magic[5] === 0x0A && magic[6] === 0x1A && magic[7] === 0x0A) {
    return { valid: true, format: 'png', sizeBytes: binaryData.length };
  }

  // JPEG: FF D8 FF
  if (magic[0] === 0xFF && magic[1] === 0xD8 && magic[2] === 0xFF) {
    return { valid: true, format: 'jpeg', sizeBytes: binaryData.length };
  }

  // WebP: 52 49 46 46 ... 57 45 42 50 (RIFF...WEBP)
  if (magic[0] === 0x52 && magic[1] === 0x49 && magic[2] === 0x46 && magic[3] === 0x46 &&
      magic[8] === 0x57 && magic[9] === 0x45 && magic[10] === 0x42 && magic[11] === 0x50) {
    return { valid: true, format: 'webp', sizeBytes: binaryData.length };
  }

  // GIF: 47 49 46 38 (GIF8)
  if (magic[0] === 0x47 && magic[1] === 0x49 && magic[2] === 0x46 && magic[3] === 0x38) {
    return { valid: true, format: 'gif', sizeBytes: binaryData.length };
  }

  return {
    valid: false,
    error: 'INVALID_IMAGE_FORMAT: Supported formats are PNG, JPEG, WebP, GIF'
  };
}

// ═══════════════════════════════════════════════════════════════
// USER-FRIENDLY MESSAGES
// ═══════════════════════════════════════════════════════════════

function getUserMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('IMAGE_TOO_LARGE')) {
    return 'Image exceeds 10MB limit. Please use a smaller image.';
  }
  if (message.includes('INVALID_IMAGE_FORMAT')) {
    return 'Invalid image format. Supported formats: PNG, JPEG, WebP, GIF.';
  }
  if (message.includes('RATE_LIMIT') || message.includes('rate limit')) {
    return 'Rate limit exceeded. Please try again later.';
  }
  if (message.includes('Vision analysis failed')) {
    return 'Image analysis failed. Please try with a different image.';
  }
  return 'An error occurred processing your image. Please try again.';
}

// ═══════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // 1. Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required', code: 'AUTH_REQUIRED' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication', code: 'AUTH_INVALID' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Subscription + Rate Limit Check
    const sub = await checkSubscription(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, user.id);
    const maxPerHour = sub.plan === 'free' ? 5 : sub.plan === 'pro' ? 50 : 500;
    const rateLimit = await checkRateLimit(
      SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
      user.id, 'multimodal-refinement', maxPerHour
    );

    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: `Rate limit exceeded. You can refine up to ${maxPerHour} specs per hour with your ${sub.plan} plan.`,
          code: 'RATE_LIMIT_EXCEEDED',
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

    // 3. Parse and Validate Request
    const rawBody = await req.json();
    let validated: MultimodalRefinementRequest;

    try {
      validated = multimodalRefinementSchema.parse(rawBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        return new Response(
          JSON.stringify({
            error: firstError.message,
            code: 'VALIDATION_ERROR',
            field: firstError.path.join('.')
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw error;
    }

    const { image, specContent, focusArea, imageDescription, additionalContext } = validated;

    // 4. Security Check
    if (detectPromptInjection(specContent)) {
      console.warn('[Multimodal] Prompt injection detected:', { user_id: user.id });
      return new Response(
        JSON.stringify({ error: 'Invalid content detected', code: 'SECURITY_ERROR' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Image Validation (for data URIs)
    const imageUrl = image;
    if (image.startsWith('data:image/')) {
      const base64Part = image.split(',')[1];
      const sizeEstimate = (base64Part.length * 3) / 4;
      if (sizeEstimate > 10 * 1024 * 1024) {
        return new Response(
          JSON.stringify({ error: 'Image exceeds 10MB limit', code: 'IMAGE_TOO_LARGE' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate magic bytes
      const binaryData = Uint8Array.from(atob(base64Part), c => c.charCodeAt(0));
      const validation = validateImageBlob(binaryData);
      if (!validation.valid) {
        return new Response(
          JSON.stringify({ error: validation.error, code: 'INVALID_IMAGE_FORMAT' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 6. Vision Analysis
    const focusPrompts: Record<string, string> = {
      ui_ux: 'Focus on user interface elements, user experience flows, and interaction patterns.',
      architecture: 'Focus on system architecture implications, component structure, and technical design.',
      features: 'Focus on feature completeness, functionality gaps, and user stories.',
      comprehensive: 'Provide a comprehensive analysis covering UI/UX, architecture, and features.'
    };

    const userPrompt = `Analyze this ${imageDescription || 'image'} in the context of the following specification.

${focusPrompts[focusArea]}

${additionalContext ? `Additional context: ${additionalContext}` : ''}

Current Specification:
---
${specContent.substring(0, 10000)}${specContent.length > 10000 ? '\n...[truncated]' : ''}
---

Provide your analysis in the specified JSON format.`;

    const messageContent: ContentPart[] = [
      { type: 'text', text: userPrompt },
      { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } }
    ];

    let visionResponse;
    let modelUsed = VISION_MODEL_PRIMARY;

    try {
      visionResponse = await retryWithBackoff(
        () => callOpenRouter({
          model: VISION_MODEL_PRIMARY,
          messages: [
            { role: 'system', content: VISION_SYSTEM_PROMPT },
            { role: 'user', content: messageContent }
          ],
          temperature: 0.4,
          maxTokens: 2000,
          responseFormat: 'json'
        } as LLMCallParams),
        { maxRetries: 2 }
      );
    } catch (primaryError) {
      console.warn('[Multimodal] Primary model failed, trying fallback:', sanitizeError(primaryError));
      modelUsed = VISION_MODEL_FALLBACK;
      try {
        visionResponse = await callOpenRouter({
          model: VISION_MODEL_FALLBACK,
          messages: [
            { role: 'system', content: VISION_SYSTEM_PROMPT },
            { role: 'user', content: messageContent }
          ],
          temperature: 0.4,
          maxTokens: 2000,
          responseFormat: 'json'
        } as LLMCallParams);
      } catch (fallbackError) {
        console.error('[Multimodal] Both models failed:', sanitizeError(fallbackError));
        throw new Error('Vision analysis failed');
      }
    }

    // 7. Parse Vision Analysis
    interface VisionAnalysis {
      imageInsights: string;
      alignmentScore: number;
      gaps: string[];
      suggestions: string[];
      detectedComponents?: string[];
      technicalRequirements?: string[];
    }

    let analysis: VisionAnalysis;

    try {
      analysis = JSON.parse(visionResponse.content);
    } catch {
      // Fallback parsing - try extracting JSON from markdown
      const jsonMatch = visionResponse.content.match(/```json\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        try {
          analysis = JSON.parse(jsonMatch[1]);
        } catch {
          analysis = {
            imageInsights: visionResponse.content,
            alignmentScore: 50,
            gaps: ['Unable to parse structured analysis'],
            suggestions: ['Re-run with clearer image or specification']
          };
        }
      } else {
        // Minimal fallback
        analysis = {
          imageInsights: visionResponse.content,
          alignmentScore: 50,
          gaps: ['Unable to parse structured analysis'],
          suggestions: ['Re-run with clearer image or specification']
        };
      }
    }

    // 8. Generate Refined Specification
    const refinementPrompt = `Based on the following visual analysis, refine the specification.

Visual Analysis:
- Insights: ${analysis.imageInsights}
- Alignment Score: ${analysis.alignmentScore}/100
- Gaps Identified: ${analysis.gaps.join(', ')}
- Suggestions: ${analysis.suggestions.join(', ')}
${analysis.detectedComponents ? `- Components: ${analysis.detectedComponents.join(', ')}` : ''}
${analysis.technicalRequirements ? `- Tech Requirements: ${analysis.technicalRequirements.join(', ')}` : ''}

Original Specification:
---
${specContent}
---

Produce a refined specification that addresses the gaps and incorporates the suggestions. Output in markdown format.`;

    const refinementResponse = await callOpenRouter({
      model: REFINEMENT_MODEL,
      messages: [
        { role: 'system', content: REFINEMENT_SYSTEM_PROMPT },
        { role: 'user', content: refinementPrompt }
      ],
      temperature: 0.5,
      maxTokens: 4000
    });

    // 9. Return Response
    const latencyMs = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        analysis: {
          imageInsights: analysis.imageInsights,
          alignmentScore: analysis.alignmentScore,
          gaps: analysis.gaps,
          suggestions: analysis.suggestions
        },
        refinedSpec: refinementResponse.content,
        metadata: {
          model: modelUsed,
          latencyMs,
          visionTokensUsed: visionResponse.usage.totalTokens
        },
        remaining: rateLimit.remaining
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': String(rateLimit.remaining)
        }
      }
    );

  } catch (error) {
    console.error('[Multimodal] Service error:', sanitizeError(error));
    return new Response(
      JSON.stringify({
        error: getUserMessage(error),
        code: 'INTERNAL_ERROR'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
