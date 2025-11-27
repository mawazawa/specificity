/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseTool, ToolParameter, ToolResult } from './base-tool.ts';
import { WebSearchTool } from './web-search-tool.ts';

export class CompetitorAnalysisTool extends BaseTool {
  name = 'competitor_analysis';
  description = 'Analyze competitors for a given product category. Finds pricing, features, and market positioning.';

  parameters: ToolParameter[] = [
    {
      name: 'category',
      type: 'string',
      description: 'Product category (e.g., "AI content generation SaaS", "fitness tracking app")',
      required: true
    },
    {
      name: 'aspects',
      type: 'string',
      description: 'What to analyze: pricing, features, technology, market_share',
      required: false,
      default: 'features'
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

    const { category, aspects = 'features' } = params;
    const startTime = Date.now();

    try {
      // Search for competitors using web search
      const searchQuery = `${category} competitors ${aspects} comparison 2025`;
      const webSearch = new WebSearchTool();
      const searchResult = await webSearch.execute({
        query: searchQuery,
        numResults: 10
      });

      if (!searchResult.success || !searchResult.data) {
        return {
          success: false,
          error: 'Failed to find competitor information'
        };
      }

      // Extract competitor insights from search results
      const competitors = searchResult.data.results.map((r: any) => ({
        name: this.extractCompanyName(r.title),
        url: r.url,
        insights: r.snippet,
        source: 'web_search'
      }));

      // Remove duplicates based on company name
      const uniqueCompetitors = Array.from(
        new Map(competitors.map((c: any) => [c.name.toLowerCase(), c])).values()
      );

      return {
        success: true,
        data: {
          category,
          aspects,
          competitors: uniqueCompetitors.slice(0, 5), // Top 5
          totalFound: uniqueCompetitors.length,
          searchQuery
        },
        metadata: {
          duration: Date.now() - startTime,
          cost: 0.02,
          source: 'web_search + analysis'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Competitor analysis failed',
        metadata: {
          duration: Date.now() - startTime,
          cost: 0,
          source: 'competitor_analysis'
        }
      };
    }
  }

  private extractCompanyName(title: string): string {
    // Extract company name from title
    // Common patterns: "CompanyName - ...", "CompanyName | ...", "CompanyName: ..."
    const match = title.match(/^([^-|:]+)/);
    return match ? match[1].trim() : title.split(' ').slice(0, 3).join(' ');
  }
}
