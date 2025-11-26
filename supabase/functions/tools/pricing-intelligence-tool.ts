import { BaseTool, ToolParams, ToolResult } from './base-tool.ts';

/**
 * Pricing Intelligence Tool
 * Scrapes and analyzes competitor pricing using Firecrawl-inspired approach
 * Returns pricing tiers, features, and recommendations
 */
export class PricingIntelligenceTool extends BaseTool {
  name = 'pricing_intelligence';
  description = 'Analyze competitor pricing strategies, tiers, and features. Scrapes pricing pages and extracts structured pricing data.';

  parameters = {
    companyName: 'Company or product name (e.g., "Notion", "Figma")',
    url: 'Direct URL to pricing page (optional, will search if not provided)',
    depth: 'Analysis depth: "quick" (pricing only), "standard" (pricing + features), "deep" (full competitive analysis)'
  };

  async execute(params: ToolParams): Promise<ToolResult> {
    try {
      const {
        companyName,
        url,
        depth = 'standard'
      } = params;

      if (!companyName && !url) {
        return this.error('Either companyName or url parameter is required');
      }

      console.log(`[PricingIntelligenceTool] Analyzing pricing for: ${companyName || url}`);

      // Use Exa to find pricing page if URL not provided
      let pricingUrl = url;
      if (!pricingUrl && companyName) {
        const EXA_API_KEY = Deno.env.get('EXA_API_KEY');
        if (EXA_API_KEY) {
          try {
            const searchResponse = await fetch('https://api.exa.ai/search', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': EXA_API_KEY
              },
              body: JSON.stringify({
                query: `${companyName} pricing page official`,
                numResults: 1,
                useAutoprompt: true,
                type: 'neural'
              })
            });

            if (searchResponse.ok) {
              const data = await searchResponse.json();
              if (data.results && data.results.length > 0) {
                pricingUrl = data.results[0].url;
                console.log(`[PricingIntelligenceTool] Found pricing page: ${pricingUrl}`);
              }
            }
          } catch (error) {
            console.warn('[PricingIntelligenceTool] Exa search failed, using fallback');
          }
        }
      }

      if (!pricingUrl) {
        return this.error(`Could not find pricing page for ${companyName}. Please provide a direct URL.`);
      }

      // Scrape pricing page
      const scrapedData = await this.scrapePricingPage(pricingUrl);

      if (!scrapedData.success) {
        return this.error(scrapedData.error || 'Failed to scrape pricing page');
      }

      // Extract pricing information
      const pricingAnalysis = this.analyzePricingData(scrapedData.content, depth);

      return this.success({
        company: companyName,
        url: pricingUrl,
        depth,
        pricingTiers: pricingAnalysis.tiers,
        recommendations: pricingAnalysis.recommendations,
        insights: pricingAnalysis.insights,
        scrapedAt: new Date().toISOString()
      });
    } catch (error) {
      return this.error(`Pricing intelligence failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Scrape pricing page using simple fetch + HTML parsing
   * (Firecrawl-inspired but simplified for edge functions)
   */
  private async scrapePricingPage(url: string): Promise<{ success: boolean; content?: string; error?: string }> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SpecificityBot/1.0; Research)'
        }
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }

      const html = await response.text();
      return { success: true, content: html };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Analyze scraped HTML to extract pricing information
   * Uses regex patterns to find common pricing indicators
   */
  private analyzePricingData(html: string, depth: string): {
    tiers: Array<{ name: string; price: string; features: string[] }>;
    recommendations: string[];
    insights: string[];
  } {
    const tiers: Array<{ name: string; price: string; features: string[] }> = [];
    const recommendations: string[] = [];
    const insights: string[] = [];

    // Extract price patterns (e.g., $19/mo, €29/month, etc.)
    const pricePattern = /[$€£¥]?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:\/\s*)?(mo|month|yr|year|user|seat)?/gi;
    const prices: string[] = [];
    let match;
    while ((match = pricePattern.exec(html)) !== null) {
      prices.push(match[0]);
    }

    // Extract tier names (common patterns)
    const tierPattern = /(free|starter|basic|pro|professional|premium|enterprise|business|team|individual|personal|plus)/gi;
    const tierNames: string[] = [];
    while ((match = tierPattern.exec(html)) !== null) {
      if (!tierNames.includes(match[1].toLowerCase())) {
        tierNames.push(match[1].toLowerCase());
      }
    }

    // Build simplified tiers
    if (prices.length > 0 && tierNames.length > 0) {
      const tiersCount = Math.min(prices.length, tierNames.length, 5); // Max 5 tiers
      for (let i = 0; i < tiersCount; i++) {
        tiers.push({
          name: tierNames[i] || `Tier ${i + 1}`,
          price: prices[i] || 'Contact sales',
          features: [] // Would need more complex parsing for features
        });
      }
    } else if (prices.length > 0) {
      // Just prices, no tier names
      prices.slice(0, 5).forEach((price, i) => {
        tiers.push({
          name: `Plan ${i + 1}`,
          price,
          features: []
        });
      });
    }

    // Generate recommendations
    if (tiers.length > 0) {
      recommendations.push(`Found ${tiers.length} pricing tiers`);

      const hasFreeTier = tierNames.some(name => name.toLowerCase() === 'free');
      if (hasFreeTier) {
        recommendations.push('Competitor offers free tier - consider freemium model');
      }

      const hasEnterprise = tierNames.some(name => name.toLowerCase() === 'enterprise');
      if (hasEnterprise) {
        recommendations.push('Competitor targets enterprise market - consider enterprise features');
      }

      // Price point analysis
      const numericPrices = prices
        .map(p => {
          const match = p.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)/);
          return match ? parseFloat(match[1].replace(/,/g, '')) : null;
        })
        .filter(p => p !== null) as number[];

      if (numericPrices.length > 0) {
        const avgPrice = numericPrices.reduce((a, b) => a + b, 0) / numericPrices.length;
        const minPrice = Math.min(...numericPrices);
        const maxPrice = Math.max(...numericPrices);

        insights.push(`Price range: $${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`);
        insights.push(`Average price point: $${avgPrice.toFixed(2)}`);
        insights.push(`Entry price: $${minPrice.toFixed(2)} (use this as competitive benchmark)`);
      }
    } else {
      recommendations.push('Could not automatically extract pricing - manual review recommended');
      insights.push('Consider using more specific pricing page URL');
    }

    return { tiers, recommendations, insights };
  }
}
