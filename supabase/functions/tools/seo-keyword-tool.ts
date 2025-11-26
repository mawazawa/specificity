import { BaseTool, ToolParams, ToolResult } from './base-tool.ts';

/**
 * SEO Keyword Research Tool
 * Analyzes keywords for search volume, competition, and intent
 * Uses free APIs and web scraping (no paid SEO tools required)
 */
export class SEOKeywordTool extends BaseTool {
  name = 'seo_keyword_research';
  description = 'Research SEO keywords: search volume estimates, competition level, related keywords, and user intent analysis.';

  parameters = {
    keyword: 'Primary keyword to research',
    includeRelated: 'Find related keywords (default: true)',
    analyzeTrends: 'Analyze search trends over time (default: true)'
  };

  async execute(params: ToolParams): Promise<ToolResult> {
    try {
      const {
        keyword,
        includeRelated = true,
        analyzeTrends = true
      } = params;

      if (!keyword || typeof keyword !== 'string') {
        return this.error('keyword parameter is required and must be a string');
      }

      console.log(`[SEOKeywordTool] Researching keyword: "${keyword}"`);

      const results: any = {
        keyword,
        analysis: {},
        relatedKeywords: [],
        trends: {},
        recommendations: []
      };

      // Use Exa to find articles about this topic
      const EXA_API_KEY = Deno.env.get('EXA_API_KEY');
      if (EXA_API_KEY) {
        try {
          const exaResponse = await fetch('https://api.exa.ai/search', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': EXA_API_KEY
            },
            body: JSON.stringify({
              query: keyword,
              numResults: 10,
              useAutoprompt: true,
              type: 'neural',
              startPublishedDate: '2025-01-01' // Recent content for trend analysis
            })
          });

          if (exaResponse.ok) {
            const exaData = await exaResponse.json();
            results.searchResults = exaData.results.length;

            // Analyze titles for keyword variations
            const titles = exaData.results.map((r: any) => r.title.toLowerCase());
            const keywordVariations = this.extractKeywordVariations(titles, keyword);

            results.relatedKeywords = keywordVariations;
          }
        } catch (error) {
          console.warn('[SEOKeywordTool] Exa search failed:', error);
        }
      }

      // Estimate search volume based on competition
      results.analysis = {
        estimatedSearchVolume: this.estimateSearchVolume(keyword, results.searchResults || 0),
        competition: this.analyzeCompetition(results.searchResults || 0),
        difficulty: this.calculateKeywordDifficulty(keyword),
        intent: this.analyzeSearchIntent(keyword),
        commercialValue: this.assessCommercialValue(keyword)
      };

      // Generate recommendations
      results.recommendations = this.generateRecommendations(keyword, results.analysis);

      // Add trend data if requested
      if (analyzeTrends) {
        results.trends = {
          trend: 'Use Google Trends for detailed historical data',
          seasonality: this.detectSeasonality(keyword),
          growth: results.searchResults > 5 ? 'Growing topic (high recent content)' : 'Niche topic (low content volume)'
        };
      }

      console.log(`[SEOKeywordTool] Analysis complete: ${results.relatedKeywords.length} related keywords found`);

      return this.success(results);
    } catch (error) {
      return this.error(`SEO keyword research failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private extractKeywordVariations(titles: string[], baseKeyword: string): string[] {
    const variations = new Set<string>();
    const words = baseKeyword.toLowerCase().split(' ');

    titles.forEach(title => {
      words.forEach(word => {
        if (title.includes(word)) {
          // Extract 3-word phrases containing the keyword
          const titleWords = title.split(' ');
          titleWords.forEach((_, i) => {
            if (i + 2 < titleWords.length) {
              const phrase = titleWords.slice(i, i + 3).join(' ');
              if (phrase.includes(word) && phrase !== baseKeyword.toLowerCase()) {
                variations.add(phrase);
              }
            }
          });
        }
      });
    });

    return Array.from(variations).slice(0, 10); // Top 10 variations
  }

  private estimateSearchVolume(keyword: string, resultCount: number): string {
    // Heuristic based on keyword length and result count
    const wordCount = keyword.split(' ').length;

    if (resultCount > 20) {
      if (wordCount <= 2) return '10K-100K/month (high volume)';
      return '1K-10K/month (medium volume)';
    } else if (resultCount > 5) {
      return '100-1K/month (low-medium volume)';
    } else {
      return '< 100/month (niche keyword)';
    }
  }

  private analyzeCompetition(resultCount: number): string {
    if (resultCount > 20) return 'High (many recent articles)';
    if (resultCount > 10) return 'Medium';
    if (resultCount > 5) return 'Low-Medium';
    return 'Low (opportunity!)';
  }

  private calculateKeywordDifficulty(keyword: string): string {
    const wordCount = keyword.split(' ').length;

    // Long-tail keywords (3+ words) are usually easier
    if (wordCount >= 3) return 'Easy (long-tail keyword)';
    if (wordCount === 2) return 'Medium';
    return 'Hard (short, competitive keyword)';
  }

  private analyzeSearchIntent(keyword: string): string {
    const lower = keyword.toLowerCase();

    // Transactional intent
    if (lower.includes('buy') || lower.includes('price') || lower.includes('cost') || lower.includes('cheap')) {
      return 'Transactional (high conversion potential)';
    }

    // Informational intent
    if (lower.includes('how') || lower.includes('what') || lower.includes('why') || lower.includes('guide') || lower.includes('tutorial')) {
      return 'Informational (educational content)';
    }

    // Navigational intent
    if (lower.includes('login') || lower.includes('sign') || lower.includes('download')) {
      return 'Navigational (brand/product search)';
    }

    // Commercial investigation
    if (lower.includes('best') || lower.includes('top') || lower.includes('review') || lower.includes('vs') || lower.includes('alternative')) {
      return 'Commercial investigation (comparison/research)';
    }

    return 'Mixed intent (requires content analysis)';
  }

  private assessCommercialValue(keyword: string): string {
    const lower = keyword.toLowerCase();
    const highValueTerms = ['software', 'tool', 'platform', 'service', 'app', 'solution', 'enterprise', 'business', 'saas'];
    const lowValueTerms = ['free', 'tutorial', 'guide', 'how to'];

    const hasHighValue = highValueTerms.some(term => lower.includes(term));
    const hasLowValue = lowValueTerms.some(term => lower.includes(term));

    if (hasHighValue && !hasLowValue) return 'High (B2B/SaaS opportunity)';
    if (hasLowValue) return 'Low (informational/free content)';
    return 'Medium';
  }

  private detectSeasonality(keyword: string): string {
    const lower = keyword.toLowerCase();
    const seasonalTerms: Record<string, string> = {
      'christmas': 'Seasonal (December peak)',
      'holiday': 'Seasonal (November-December)',
      'summer': 'Seasonal (June-August)',
      'winter': 'Seasonal (December-February)',
      'tax': 'Seasonal (March-April peak)',
      'back to school': 'Seasonal (August-September)',
      'valentine': 'Seasonal (February)',
      'halloween': 'Seasonal (October)'
    };

    for (const [term, season] of Object.entries(seasonalTerms)) {
      if (lower.includes(term)) return season;
    }

    return 'Year-round (no strong seasonality detected)';
  }

  private generateRecommendations(keyword: string, analysis: any): string[] {
    const recommendations: string[] = [];

    if (analysis.difficulty === 'Easy (long-tail keyword)') {
      recommendations.push('✅ Good target: Easy to rank for long-tail keyword');
    } else if (analysis.difficulty === 'Hard (short, competitive keyword)') {
      recommendations.push('⚠️  High difficulty: Consider targeting long-tail variations instead');
    }

    if (analysis.commercialValue === 'High (B2B/SaaS opportunity)') {
      recommendations.push('💰 High commercial value: Prioritize this keyword for revenue potential');
    }

    if (analysis.intent === 'Transactional (high conversion potential)') {
      recommendations.push('🎯 High conversion potential: Create product/pricing page');
    } else if (analysis.intent === 'Informational (educational content)') {
      recommendations.push('📚 Informational intent: Create comprehensive guide or tutorial');
    }

    if (analysis.competition === 'Low (opportunity!)') {
      recommendations.push('🚀 Low competition: Excellent opportunity to dominate search results');
    } else if (analysis.competition === 'High (many recent articles)') {
      recommendations.push('📈 High competition: Need high-quality content to compete');
    }

    recommendations.push(`💡 Strategy: Create ${analysis.intent.includes('Informational') ? 'educational blog post' : 'conversion-focused landing page'}`);

    return recommendations;
  }
}
