/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseTool, ToolParameter, ToolResult } from './base-tool.ts';
import { WebSearchTool } from './web-search-tool.ts';

export class MarketDataTool extends BaseTool {
  name = 'market_data';
  description = 'Research market size, trends, and industry data for a given product category.';

  parameters: ToolParameter[] = [
    {
      name: 'category',
      type: 'string',
      description: 'Product category or market (e.g., "AI SaaS", "fitness apps", "e-commerce platforms")',
      required: true
    },
    {
      name: 'metrics',
      type: 'string',
      description: 'What metrics to find: market_size, growth_rate, trends, all',
      required: false,
      default: 'all'
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

    const { category, metrics = 'all' } = params;
    const startTime = Date.now();

    try {
      // Build search queries based on requested metrics
      const queries = [];

      if (metrics === 'all' || metrics === 'market_size') {
        queries.push(`${category} market size 2025 TAM SAM`);
      }
      if (metrics === 'all' || metrics === 'growth_rate') {
        queries.push(`${category} market growth rate CAGR 2025`);
      }
      if (metrics === 'all' || metrics === 'trends') {
        queries.push(`${category} industry trends 2025`);
      }

      // Execute all queries in parallel
      const webSearch = new WebSearchTool();
      const searchResults = await Promise.all(
        queries.map(query =>
          webSearch.execute({ query, numResults: 5 })
        )
      );

      // Combine all results
      const allResults: any[] = [];
      searchResults.forEach(result => {
        if (result.success && result.data) {
          allResults.push(...result.data.results);
        }
      });

      // Extract market insights
      const insights = allResults.map((r: any) => ({
        title: r.title,
        snippet: r.snippet,
        url: r.url,
        source: this.extractSource(r.url)
      }));

      return {
        success: true,
        data: {
          category,
          metrics,
          insights: insights.slice(0, 10), // Top 10 insights
          totalSources: insights.length,
          queries
        },
        metadata: {
          duration: Date.now() - startTime,
          cost: 0.03, // Multiple searches
          source: 'web_search + analysis'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Market data research failed',
        metadata: {
          duration: Date.now() - startTime,
          cost: 0,
          source: 'market_data'
        }
      };
    }
  }

  private extractSource(url: string): string {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace('www.', '');
    } catch {
      return 'unknown';
    }
  }
}
