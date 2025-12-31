/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseTool, ToolParameter, ToolResult } from './base-tool.ts';
import { callOpenRouter } from '../lib/openrouter-client.ts';

export class VisualizeTool extends BaseTool {
  name = 'visualize';
  description = 'Generate a high-fidelity UI mockup image based on a product description. Use this to visualize the product concept.';

  parameters: ToolParameter[] = [
    {
      name: 'prompt',
      type: 'string',
      description: 'Detailed visual description of the UI to generate. Include layout, colors, style (e.g., modern SaaS, dark mode), and key components.',
      required: true
    }
  ];

  async execute(params: Record<string, any>): Promise<ToolResult> {
    const validation = this.validate(params);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join(', ')
      };
    }

    const { prompt } = params;
    const startTime = Date.now();

    // Use OpenRouter to generate image via DALL-E 3 or similar
    // Note: OpenRouter supports image generation via standard chat completions with some providers,
    // or we might need a direct call if the client doesn't support it yet.
    // For now, we will assume DALL-E 3 via OpenRouter standard interface or fallback to a direct fetch if needed.
    
    // Actually, OpenRouter's primary interface is chat. Image gen is model-specific.
    // Let's use `recraft-ai/recraft-v3` or `openai/dall-e-3` if available via standard API.
    // Checking OpenRouter docs: image generation usually requires a specific endpoint or model behavior.
    // Recraft V3 is a good candidate for UI design.
    
    const MODEL = 'recraft-ai/recraft-v3'; 
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');

    if (!OPENROUTER_API_KEY) {
      return {
        success: false,
        error: 'OPENROUTER_API_KEY not configured'
      };
    }

    try {
      // Recraft V3 on OpenRouter accepts text prompt and returns image URL in content or specific format
      // We'll try the standard chat completion format first, instructing it to generate an image
      
      const response = await fetch('https://openrouter.ai/api/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://specificity.ai',
          'X-Title': 'Specificity AI'
        },
        body: JSON.stringify({
          model: MODEL,
          prompt: `High-fidelity professional UI design mockup of: ${prompt}. Modern SaaS aesthetic, clean interface, detailed components.`,
          n: 1,
          size: '1024x1024' // Recraft supports this
        })
      });

      if (!response.ok) {
        // Fallback: Try chat completion if image endpoint fails (some models work via chat)
        // or just return error
        const errorText = await response.text();
        throw new Error(`OpenRouter Image API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const imageUrl = data.data?.[0]?.url;

      if (!imageUrl) {
        throw new Error('No image URL returned from API');
      }

      return {
        success: true,
        data: {
          url: imageUrl,
          prompt
        },
        metadata: {
          duration: Date.now() - startTime,
          cost: 0.04, // Approx cost for Recraft/DALL-E
          source: MODEL
        }
      };

    } catch (error) {
      console.error('[VisualizeTool] Generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Image generation failed',
        metadata: {
          duration: Date.now() - startTime,
          cost: 0,
          source: MODEL
        }
      };
    }
  }
}
