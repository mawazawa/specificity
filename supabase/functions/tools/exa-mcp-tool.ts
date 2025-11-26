import { BaseTool, ToolParams, ToolResult } from './base-tool.ts';

/**
 * Exa MCP Tool - Uses Exa's hosted MCP server for advanced AI search
 * Powered by: https://mcp.exa.ai/mcp
 *
 * Exa provides neural search optimized for AI agents with:
 * - Semantic search understanding
 * - Domain-specific searches (technical, research, etc.)
 * - Auto-prompt enhancement
 * - November 2025 content filtering
 */
export class ExaMCPTool extends BaseTool {
  name = 'exa_search';
  description = 'Advanced AI-powered web search using Exa neural search (November 2025). Better than traditional search for technical queries, research, and bleeding-edge technology discovery.';

  parameters = {
    query: 'Search query (will be enhanced by AI)',
    numResults: 'Number of results (default: 8, max: 20)',
    searchType: 'Type: "neural" (semantic), "keyword" (exact), or "auto" (default: auto)',
    category: 'Category: "company", "research paper", "news", "github", "tweet", "personal site", or leave empty for all',
    includeText: 'Include full page text (default: true)',
    startPublishedDate: 'Filter to content after this date (YYYY-MM-DD, default: 2025-11-01 for bleeding-edge)'
  };

  async execute(params: ToolParams): Promise<ToolResult> {
    try {
      const {
        query,
        numResults = 8,
        searchType = 'auto',
        category,
        includeText = true,
        startPublishedDate = '2025-11-01' // Default to Nov 2025+ for bleeding-edge content
      } = params;

      if (!query || typeof query !== 'string') {
        return this.error('query parameter is required and must be a string');
      }

      const EXA_API_KEY = Deno.env.get('EXA_API_KEY');
      if (!EXA_API_KEY) {
        return this.error('EXA_API_KEY environment variable not configured');
      }

      console.log(`[ExaMCPTool] Searching: "${query}" (${searchType}, max ${numResults} results, since ${startPublishedDate})`);

      const requestBody: any = {
        query,
        numResults: Math.min(Number(numResults), 20),
        type: searchType,
        useAutoprompt: true, // Let Exa enhance the query
        contents: {
          text: includeText
        }
      };

      // Add optional filters
      if (category) {
        requestBody.category = category;
      }

      if (startPublishedDate) {
        requestBody.startPublishedDate = startPublishedDate;
      }

      const response = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': EXA_API_KEY
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        return this.error(`Exa API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        return this.success({
          query,
          resultsCount: 0,
          message: 'No results found. Try a different query or broader search terms.',
          results: []
        });
      }

      // Format results for AI consumption
      const formattedResults = data.results.map((result: any, index: number) => ({
        rank: index + 1,
        title: result.title,
        url: result.url,
        publishedDate: result.publishedDate,
        author: result.author,
        score: result.score,
        text: result.text ? result.text.slice(0, 1000) + (result.text.length > 1000 ? '...' : '') : null, // Limit text to 1000 chars
        highlights: result.highlights || []
      }));

      console.log(`[ExaMCPTool] Found ${formattedResults.length} results`);

      return this.success({
        query,
        autopromptString: data.autopromptString, // Show how Exa enhanced the query
        resultsCount: formattedResults.length,
        results: formattedResults,
        searchMetadata: {
          searchType,
          category: category || 'all',
          dateFilter: startPublishedDate
        }
      });
    } catch (error) {
      return this.error(`Exa search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Deep search with content summarization (more expensive but higher quality)
   */
  async deepSearch(params: ToolParams): Promise<ToolResult> {
    try {
      const {
        query,
        numResults = 5
      } = params;

      if (!query || typeof query !== 'string') {
        return this.error('query parameter is required and must be a string');
      }

      const EXA_API_KEY = Deno.env.get('EXA_API_KEY');
      if (!EXA_API_KEY) {
        return this.error('EXA_API_KEY environment variable not configured');
      }

      console.log(`[ExaMCPTool] Deep search: "${query}"`);

      const response = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': EXA_API_KEY
        },
        body: JSON.stringify({
          query,
          numResults: Math.min(Number(numResults), 10),
          useAutoprompt: true,
          type: 'neural',
          contents: {
            text: true,
            summary: true // Request AI-generated summaries
          },
          startPublishedDate: '2025-11-01'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        return this.error(`Exa API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();

      const formattedResults = data.results.map((result: any, index: number) => ({
        rank: index + 1,
        title: result.title,
        url: result.url,
        summary: result.summary, // AI-generated summary
        publishedDate: result.publishedDate,
        author: result.author,
        score: result.score
      }));

      return this.success({
        query,
        autopromptString: data.autopromptString,
        resultsCount: formattedResults.length,
        results: formattedResults,
        mode: 'deep_search_with_summaries'
      });
    } catch (error) {
      return this.error(`Exa deep search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
