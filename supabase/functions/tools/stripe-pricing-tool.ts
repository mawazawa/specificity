import { BaseTool, ToolParams, ToolResult } from './base-tool.ts';

/**
 * Stripe Pricing Calculator
 * Calculates payment processing costs for different scenarios
 * Based on official Stripe pricing (as of Nov 2025)
 */
export class StripePricingTool extends BaseTool {
  name = 'stripe_pricing';
  description = 'Calculate Stripe payment processing fees for different transaction volumes, card types, and regions.';

  parameters = {
    transactionAmount: 'Transaction amount in USD',
    monthlyVolume: 'Expected monthly transaction volume (number of transactions)',
    region: 'Region: "us" (default), "eu", "uk", "ca", "au"',
    cardType: 'Card type: "domestic" (default), "international", "amex"',
    includePlatformFee: 'For platforms using Stripe Connect (default: false)'
  };

  async execute(params: ToolParams): Promise<ToolResult> {
    try {
      const {
        transactionAmount,
        monthlyVolume = 100,
        region = 'us',
        cardType = 'domestic',
        includePlatformFee = false
      } = params;

      if (!transactionAmount || isNaN(Number(transactionAmount))) {
        return this.error('transactionAmount parameter is required and must be a number');
      }

      const amount = Number(transactionAmount);
      const volume = Number(monthlyVolume);

      console.log(`[StripePricingTool] Calculating fees for $${amount} x ${volume} transactions (${region}, ${cardType})`);

      // Stripe pricing (Nov 2025)
      const pricing = {
        us: {
          domestic: { percent: 2.9, fixed: 0.30 },
          international: { percent: 3.9, fixed: 0.30 },
          amex: { percent: 3.5, fixed: 0.30 }
        },
        eu: {
          domestic: { percent: 1.5, fixed: 0.25 }, // EEA cards
          international: { percent: 2.9, fixed: 0.25 },
          amex: { percent: 2.9, fixed: 0.25 }
        },
        uk: {
          domestic: { percent: 1.5, fixed: 0.20 },
          international: { percent: 2.9, fixed: 0.20 },
          amex: { percent: 2.9, fixed: 0.20 }
        },
        ca: {
          domestic: { percent: 2.9, fixed: 0.30 },
          international: { percent: 3.9, fixed: 0.30 },
          amex: { percent: 3.5, fixed: 0.30 }
        },
        au: {
          domestic: { percent: 1.75, fixed: 0.30 },
          international: { percent: 3.5, fixed: 0.30 },
          amex: { percent: 2.9, fixed: 0.30 }
        }
      };

      const rates = pricing[region as keyof typeof pricing]?.[cardType as keyof typeof pricing.us] || pricing.us.domestic;

      // Calculate per-transaction fee
      const percentFee = (amount * rates.percent) / 100;
      const totalFeePerTransaction = percentFee + rates.fixed;
      const netPerTransaction = amount - totalFeePerTransaction;

      // Calculate monthly totals
      const monthlyGross = amount * volume;
      const monthlyFees = totalFeePerTransaction * volume;
      const monthlyNet = monthlyGross - monthlyFees;

      // Add Stripe Connect fee if applicable (0.25% + $0.25 per transaction)
      let connectFees = 0;
      if (includePlatformFee) {
        const connectPercent = (amount * 0.25) / 100;
        connectFees = (connectPercent + 0.25) * volume;
      }

      // Calculate annual projections
      const annualGross = monthlyGross * 12;
      const annualFees = monthlyFees * 12;
      const annualNet = monthlyNet * 12;

      const results = {
        perTransaction: {
          grossAmount: `$${amount.toFixed(2)}`,
          processingFee: `$${totalFeePerTransaction.toFixed(2)} (${rates.percent}% + $${rates.fixed})`,
          netAmount: `$${netPerTransaction.toFixed(2)}`,
          feePercentage: `${((totalFeePerTransaction / amount) * 100).toFixed(2)}%`
        },
        monthly: {
          transactions: volume,
          grossRevenue: `$${monthlyGross.toFixed(2)}`,
          processingFees: `$${monthlyFees.toFixed(2)}`,
          connectFees: includePlatformFee ? `$${connectFees.toFixed(2)}` : 'N/A',
          totalFees: includePlatformFee ? `$${(monthlyFees + connectFees).toFixed(2)}` : `$${monthlyFees.toFixed(2)}`,
          netRevenue: includePlatformFee ? `$${(monthlyNet - connectFees).toFixed(2)}` : `$${monthlyNet.toFixed(2)}`
        },
        annual: {
          grossRevenue: `$${annualGross.toFixed(2)}`,
          processingFees: `$${annualFees.toFixed(2)}`,
          connectFees: includePlatformFee ? `$${(connectFees * 12).toFixed(2)}` : 'N/A',
          netRevenue: includePlatformFee ? `$${(annualNet - connectFees * 12).toFixed(2)}` : `$${annualNet.toFixed(2)}`
        },
        recommendations: this.generateRecommendations(amount, volume, rates.percent, region as string),
        pricingDetails: {
          region,
          cardType,
          percentRate: `${rates.percent}%`,
          fixedFee: `$${rates.fixed}`,
          platformFees: includePlatformFee ? '0.25% + $0.25' : 'Not included'
        },
        alternatives: this.compareAlternatives(totalFeePerTransaction, amount)
      };

      console.log(`[StripePricingTool] Monthly fees: $${monthlyFees.toFixed(2)} (${volume} transactions)`);

      return this.success(results);
    } catch (error) {
      return this.error(`Stripe pricing calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private generateRecommendations(amount: number, volume: number, percentRate: number, region: string): string[] {
    const recommendations: string[] = [];

    // Volume-based recommendations
    if (volume > 1000) {
      recommendations.push('💡 High volume detected: Contact Stripe for volume discounts (typically available at $1M+ annual processing)');
    }

    // Transaction size recommendations
    if (amount < 10) {
      recommendations.push('⚠️  Small transactions: High percentage fees. Consider minimum order amounts or tiered pricing.');
    } else if (amount > 500) {
      recommendations.push('✅ Large transactions: Percentage fees are more favorable at this price point.');
    }

    // Regional optimization
    if (region === 'us') {
      recommendations.push('🌍 International cards: Will incur higher fees (3.9%). Consider showing estimated fees at checkout.');
    } else if (region === 'eu') {
      recommendations.push('🇪🇺 EU advantage: Lower rates for EEA cards (1.5%). Optimize for local payment methods.');
    }

    // Alternative payment methods
    if (amount > 1000) {
      recommendations.push('💳 Large transactions: Consider ACH/bank transfer for lower fees on high-value transactions.');
    }

    // Pricing strategy
    const effectiveFeePercent = percentRate;
    if (effectiveFeePercent > 3) {
      recommendations.push('📊 Pass fees to customer: Consider adding processing fee or building into product pricing.');
    }

    recommendations.push('🔒 Security: Stripe fees include PCI compliance, fraud detection, and dispute handling (valuable at scale).');

    return recommendations;
  }

  private compareAlternatives(stripeFee: number, amount: number): Array<{ provider: string; estimatedFee: string; savings: string }> {
    // Competitor pricing estimates (as of Nov 2025)
    return [
      {
        provider: 'Stripe',
        estimatedFee: `$${stripeFee.toFixed(2)}`,
        savings: 'Baseline'
      },
      {
        provider: 'PayPal',
        estimatedFee: `$${((amount * 0.0349) + 0.49).toFixed(2)}`,
        savings: stripeFee < ((amount * 0.0349) + 0.49) ? 'Stripe cheaper' : 'PayPal cheaper'
      },
      {
        provider: 'Square',
        estimatedFee: `$${((amount * 0.029) + 0.30).toFixed(2)}`,
        savings: 'Similar to Stripe'
      },
      {
        provider: 'ACH/Bank Transfer',
        estimatedFee: amount > 1000 ? '$0.25 - $5.00' : 'Not cost-effective',
        savings: amount > 1000 ? 'Significant savings for large transactions' : 'N/A'
      }
    ];
  }
}
