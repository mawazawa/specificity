import { BaseTool } from './base-tool.ts';
import { WebSearchTool } from './web-search-tool.ts';
import { ExaMCPTool } from './exa-mcp-tool.ts';
import { CompetitorAnalysisTool } from './competitor-analysis-tool.ts';
import { GitHubSearchTool } from './github-search-tool.ts';
import { NPMSearchTool } from './npm-search-tool.ts';
import { MarketDataTool } from './market-data-tool.ts';
import { PricingIntelligenceTool } from './pricing-intelligence-tool.ts';
import { SEOKeywordTool } from './seo-keyword-tool.ts';
import { StripePricingTool } from './stripe-pricing-tool.ts';
import { AWSCostEstimator } from './aws-cost-estimator.ts';
import { StackOverflowSearchTool } from './stackoverflow-search-tool.ts';
import { AppStoreAnalyticsTool } from './appstore-analytics-tool.ts';

/**
 * Tool Registry - Auto-discovery and management of available tools
 */
export class ToolRegistry {
  private tools: Map<string, BaseTool> = new Map();

  constructor() {
    this.registerDefaultTools();
  }

  private registerDefaultTools() {
    // Search & Research Tools
    this.register(new WebSearchTool());
    this.register(new ExaMCPTool()); // Advanced AI-powered neural search (Nov 2025)
    this.register(new StackOverflowSearchTool()); // Technical Q&A

    // Competitive Intelligence
    this.register(new CompetitorAnalysisTool());
    this.register(new PricingIntelligenceTool()); // Scrape competitor pricing
    this.register(new AppStoreAnalyticsTool()); // Mobile app metrics

    // SEO & Marketing
    this.register(new SEOKeywordTool()); // Keyword research & trends

    // Financial & Cost Analysis
    this.register(new StripePricingTool()); // Payment processing costs
    this.register(new AWSCostEstimator()); // Cloud infrastructure costs
    this.register(new MarketDataTool()); // TAM/SAM/market research

    // Developer Tools
    this.register(new GitHubSearchTool()); // Open source discovery
    this.register(new NPMSearchTool()); // Package research
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
