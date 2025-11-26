import { BaseTool, ToolParams, ToolResult } from './base-tool.ts';

/**
 * StackOverflow Search Tool
 * Finds technical solutions, error messages, and best practices from StackOverflow
 * Uses StackExchange API (free, no auth required for basic searches)
 */
export class StackOverflowSearchTool extends BaseTool {
  name = 'stackoverflow_search';
  description = 'Search StackOverflow for technical solutions, error messages, code examples, and best practices.';

  parameters = {
    query: 'Search query (error message, technical question, or technology)',
    tags: 'Filter by tags (e.g., "javascript;react;typescript")',
    sort: 'Sort by: "relevance", "votes", "activity", "creation" (default: votes)'
  };

  async execute(params: ToolParams): Promise<ToolResult> {
    try {
      const {
        query,
        tags,
        sort = 'votes'
      } = params;

      if (!query || typeof query !== 'string') {
        return this.error('query parameter is required and must be a string');
      }

      console.log(`[StackOverflowSearchTool] Searching: "${query}"`);

      // Build StackExchange API URL
      const apiUrl = new URL('https://api.stackexchange.com/2.3/search/advanced');
      apiUrl.searchParams.append('order', 'desc');
      apiUrl.searchParams.append('sort', sort);
      apiUrl.searchParams.append('q', query);
      apiUrl.searchParams.append('site', 'stackoverflow');
      apiUrl.searchParams.append('pagesize', '10');
      apiUrl.searchParams.append('filter', 'withbody'); // Include question body

      if (tags) {
        apiUrl.searchParams.append('tagged', tags);
      }

      const response = await fetch(apiUrl.toString(), {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        return this.error(`StackOverflow API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        return this.success({
          query,
          resultsCount: 0,
          message: 'No results found. Try different keywords or broader search terms.',
          results: []
        });
      }

      // Format results
      const results = data.items.slice(0, 5).map((item: any) => ({
        title: item.title,
        link: item.link,
        score: item.score,
        answerCount: item.answer_count,
        isAnswered: item.is_answered,
        viewCount: item.view_count,
        creationDate: new Date(item.creation_date * 1000).toISOString().split('T')[0],
        tags: item.tags,
        excerpt: this.cleanHtml(item.body).slice(0, 300) + '...',
        accepted: item.accepted_answer_id ? true : false
      }));

      const recommendations = this.generateRecommendations(results);

      console.log(`[StackOverflowSearchTool] Found ${results.length} results`);

      return this.success({
        query,
        resultsCount: results.length,
        results,
        recommendations,
        topAnswer: results.find(r => r.accepted && r.score > 10),
        searchUrl: `https://stackoverflow.com/search?q=${encodeURIComponent(query)}`
      });
    } catch (error) {
      return this.error(`StackOverflow search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private cleanHtml(html: string): string {
    // Remove HTML tags and decode entities
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  private generateRecommendations(results: any[]): string[] {
    const recommendations: string[] = [];

    const answeredCount = results.filter(r => r.isAnswered).length;
    const acceptedCount = results.filter(r => r.accepted).length;
    const highScoreCount = results.filter(r => r.score > 10).length;

    if (acceptedCount > 0) {
      recommendations.push(`✅ Found ${acceptedCount} question(s) with accepted answers - check these first`);
    }

    if (highScoreCount > 0) {
      recommendations.push(`⭐ ${highScoreCount} highly-voted solutions (score > 10) - community validated`);
    }

    if (answeredCount === 0) {
      recommendations.push('⚠️  No answered questions found - this might be a very specific or new issue');
    }

    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    if (avgScore > 20) {
      recommendations.push('🔥 High average score - well-known problem with established solutions');
    } else if (avgScore < 5) {
      recommendations.push('💡 Low engagement - consider alternative search terms or approaches');
    }

    recommendations.push('📚 Read multiple answers to understand different approaches');

    return recommendations;
  }
}
