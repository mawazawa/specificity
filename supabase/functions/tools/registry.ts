/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseTool } from './base-tool.ts';
import { WebSearchTool } from './web-search-tool.ts';
import { CompetitorAnalysisTool } from './competitor-analysis-tool.ts';
import { GitHubSearchTool } from './github-search-tool.ts';
import { NPMSearchTool } from './npm-search-tool.ts';
import { MarketDataTool } from './market-data-tool.ts';

/**
 * Tool Registry - Auto-discovery and management of available tools
 */
export class ToolRegistry {
  private tools: Map<string, BaseTool> = new Map();

  constructor() {
    this.registerDefaultTools();
  }

  private registerDefaultTools() {
    this.register(new WebSearchTool());
    this.register(new CompetitorAnalysisTool());
    this.register(new GitHubSearchTool());
    this.register(new NPMSearchTool());
    this.register(new MarketDataTool());
  }

  register(tool: BaseTool) {
    this.tools.set(tool.name, tool);
    console.log(`[ToolRegistry] Registered tool: ${tool.name}`);
  }

  get(name: string): BaseTool | undefined {
    return this.tools.get(name);
  }

  list(): BaseTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get formatted description of all tools for LLM prompts
   */
  getPromptDescription(): string {
    return this.list()
      .map(tool => tool.toPromptString())
      .join('\n\n');
  }

  /**
   * Execute a tool by name with parameters
   */
  async execute(toolName: string, params: Record<string, any>) {
    const tool = this.get(toolName);

    if (!tool) {
      return {
        success: false,
        error: `Tool not found: ${toolName}. Available tools: ${this.list().map(t => t.name).join(', ')}`
      };
    }

    console.log(`[ToolRegistry] Executing tool: ${toolName} with params:`, params);
    const result = await tool.execute(params);
    console.log(`[ToolRegistry] Tool ${toolName} completed in ${result.metadata?.duration}ms`);

    return result;
  }
}
