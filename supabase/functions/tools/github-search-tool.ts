import { BaseTool, ToolParameter, ToolResult } from './base-tool.ts';

export class GitHubSearchTool extends BaseTool {
  name = 'github_search';
  description = 'Search GitHub for relevant open-source projects, libraries, and frameworks. Great for finding implementation examples.';

  parameters: ToolParameter[] = [
    {
      name: 'query',
      type: 'string',
      description: 'Search query (e.g., "React authentication library", "Next.js e-commerce template")',
      required: true
    },
    {
      name: 'language',
      type: 'string',
      description: 'Programming language filter (e.g., "typescript", "python", "javascript")',
      required: false
    },
    {
      name: 'sort',
      type: 'string',
      description: 'Sort by: stars, updated, created',
      required: false,
      default: 'stars'
    }
  ];

  async execute(params: Record<string, unknown>): Promise<ToolResult> {
    const validation = this.validate(params);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join(', ')
      };
    }

    const { query, language, sort = 'stars' } = params;
    const startTime = Date.now();

    try {
      // Build search query
      let searchQuery = query;
      if (language) {
        searchQuery += ` language:${language}`;
      }

      const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(searchQuery)}&sort=${sort}&per_page=10`;

      const response = await this.fetchWithTimeout(url, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Specificity-AI'
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();

      const repositories = data.items?.map((repo: any) => ({
        name: repo.full_name,
        description: repo.description || 'No description',
        stars: repo.stargazers_count,
        url: repo.html_url,
        language: repo.language,
        lastUpdated: repo.updated_at,
        topics: repo.topics || [],
        isArchived: repo.archived
      })) || [];

      return {
        success: true,
        data: {
          repositories: repositories.filter((r: any) => !r.isArchived), // Filter out archived repos
          totalCount: data.total_count,
          query: searchQuery
        },
        metadata: {
          duration: Date.now() - startTime,
          cost: 0, // GitHub API is free
          source: 'github_api'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'GitHub search failed',
        metadata: {
          duration: Date.now() - startTime,
          cost: 0,
          source: 'github_api'
        }
      };
    }
  }
}
