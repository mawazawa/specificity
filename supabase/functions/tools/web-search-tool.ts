import { BaseTool, ToolParameter, ToolResult } from './base-tool.ts';

export class WebSearchTool extends BaseTool {
  name = 'web_search';
  description = 'Search the web for latest information (November 2025). Always use this to verify technology recommendations are current.';

  parameters: ToolParameter[] = [
    {
      name: 'query',
      type: 'string',
      description: 'Search query - be specific about what you need to find',
      required: true
    },
    {
      name: 'numResults',
      type: 'number',
      description: 'Number of results to return (1-20)',
      required: false,
      default: 8
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

    const { query, numResults = 8 } = params;
    const startTime = Date.now();
    const EXA_API_KEY = Deno.env.get('EXA_API_KEY');

    if (!EXA_API_KEY) {
      return {
        success: false,
        error: 'EXA_API_KEY not configured'
      };
    }

    try {
      const response = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${EXA_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query,
          type: 'neural',
          useAutoprompt: true,
          numResults: Math.min(numResults, 20),
          // CRITICAL: Filter to recent content only (November 2025)
          startPublishedDate: '2025-11-01'
        })
      });

      if (!response.ok) {
        throw new Error(`Exa API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        data: {
          results: data.results.map((r: any) => ({
            title: r.title,
            url: r.url,
            snippet: r.text || r.snippet,
            publishedDate: r.publishedDate,
            score: r.score
          })),
          query,
          totalResults: data.results.length
        },
        metadata: {
          duration: Date.now() - startTime,
          cost: 0.01,
          source: 'exa'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
        metadata: {
          duration: Date.now() - startTime,
          cost: 0,
          source: 'exa'
        }
      };
    }
  }
}
