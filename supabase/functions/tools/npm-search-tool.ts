/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseTool, ToolParameter, ToolResult } from './base-tool.ts';

export class NPMSearchTool extends BaseTool {
  name = 'npm_search';
  description = 'Search npm registry for packages. Use this to find the latest versions of libraries and frameworks.';

  parameters: ToolParameter[] = [
    {
      name: 'query',
      type: 'string',
      description: 'Package name or search query (e.g., "react", "authentication library")',
      required: true
    },
    {
      name: 'size',
      type: 'number',
      description: 'Number of results to return (1-20)',
      required: false,
      default: 10
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

    const { query, size = 10 } = params;
    const startTime = Date.now();

    try {
      // Use npm registry search API
      const url = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=${Math.min(size, 20)}`;

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`npm API error: ${response.status}`);
      }

      const data = await response.json();

      const packages = data.objects?.map((item: any) => {
        const pkg = item.package;
        return {
          name: pkg.name,
          description: pkg.description || 'No description',
          version: pkg.version,
          author: pkg.author?.name || pkg.publisher?.username || 'Unknown',
          keywords: pkg.keywords || [],
          npmUrl: `https://www.npmjs.com/package/${pkg.name}`,
          repository: pkg.links?.repository,
          downloads: item.score?.detail?.popularity || 0,
          quality: item.score?.detail?.quality || 0,
          maintenance: item.score?.detail?.maintenance || 0,
          score: item.score?.final || 0
        };
      }) || [];

      // Sort by score
      packages.sort((a: any, b: any) => b.score - a.score);

      return {
        success: true,
        data: {
          packages,
          totalCount: data.total,
          query
        },
        metadata: {
          duration: Date.now() - startTime,
          cost: 0, // npm registry is free
          source: 'npm_registry'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'npm search failed',
        metadata: {
          duration: Date.now() - startTime,
          cost: 0,
          source: 'npm_registry'
        }
      };
    }
  }
}
