import { BaseTool, ToolParams, ToolResult } from './base-tool.ts';

/**
 * AWS Cost Estimator
 * Estimates AWS infrastructure costs for common SaaS architectures
 * Based on AWS pricing as of November 2025
 */
export class AWSCostEstimator extends BaseTool {
  name = 'aws_cost_estimator';
  description = 'Estimate AWS infrastructure costs for web applications based on traffic, compute, storage, and data transfer requirements.';

  parameters = {
    monthlyUsers: 'Expected monthly active users (e.g., 1000, 10000, 100000)',
    architecture: 'Architecture type: "simple" (single EC2), "standard" (EC2 + RDS + S3), "scalable" (ALB + Auto Scaling + RDS Multi-AZ + CloudFront)',
    computeType: 'Compute: "t3.micro", "t3.small", "t3.medium", "t3.large", "t3.xlarge"',
    databaseSize: 'Database storage in GB (default: 20)',
    s3Storage: 'S3 storage in GB (default: 100)',
    dataTransfer: 'Monthly data transfer out in GB (default: 100)'
  };

  async execute(params: ToolParams): Promise<ToolResult> {
    try {
      const {
        monthlyUsers,
        architecture = 'standard',
        computeType = 't3.small',
        databaseSize = 20,
        s3Storage = 100,
        dataTransfer = 100
      } = params;

      if (!monthlyUsers || isNaN(Number(monthlyUsers))) {
        return this.error('monthlyUsers parameter is required and must be a number');
      }

      const users = Number(monthlyUsers);

      console.log(`[AWSCostEstimator] Estimating costs for ${users} users (${architecture} architecture)`);

      // AWS Pricing (us-east-1, November 2025)
      const pricing = {
        compute: {
          't3.micro': { hourly: 0.0104, monthly: 7.49 },
          't3.small': { hourly: 0.0208, monthly: 14.98 },
          't3.medium': { hourly: 0.0416, monthly: 29.95 },
          't3.large': { hourly: 0.0832, monthly: 59.90 },
          't3.xlarge': { hourly: 0.1664, monthly: 119.81 }
        },
        rds: {
          't3.micro': { hourly: 0.017, monthly: 12.24 },
          't3.small': { hourly: 0.034, monthly: 24.48 },
          't3.medium': { hourly: 0.068, monthly: 48.96 }
        },
        storage: {
          rds_gp3: 0.115, // per GB/month
          s3_standard: 0.023, // per GB/month (first 50 TB)
          ebs_gp3: 0.08 // per GB/month
        },
        dataTransfer: {
          first10TB: 0.09, // per GB
          next40TB: 0.085,
          next100TB: 0.07
        },
        loadBalancer: {
          alb: 22.50 // per month + LCU charges
        },
        cloudfront: {
          dataTransfer: 0.085 // per GB (simplified)
        }
      };

      const costs: any = {
        compute: 0,
        database: 0,
        storage: 0,
        dataTransfer: 0,
        loadBalancer: 0,
        cdn: 0,
        backup: 0,
        monitoring: 0
      };

      // Compute costs
      if (architecture === 'simple') {
        costs.compute = pricing.compute[computeType as keyof typeof pricing.compute]?.monthly || 29.95;
      } else if (architecture === 'standard') {
        costs.compute = (pricing.compute[computeType as keyof typeof pricing.compute]?.monthly || 29.95) * 2; // 2 instances for HA
      } else if (architecture === 'scalable') {
        // Auto-scaling: estimate based on users
        const instanceCount = Math.max(2, Math.ceil(users / 10000)); // 1 instance per 10K users, min 2
        costs.compute = (pricing.compute[computeType as keyof typeof pricing.compute]?.monthly || 29.95) * instanceCount;
        costs.loadBalancer = pricing.loadBalancer.alb + (users / 100000 * 10); // LCU costs
      }

      // Database costs
      if (architecture !== 'simple') {
        const dbInstance = users > 50000 ? 't3.medium' : users > 10000 ? 't3.small' : 't3.micro';
        const isMultiAZ = architecture === 'scalable';
        costs.database = pricing.rds[dbInstance].monthly * (isMultiAZ ? 2 : 1);
        costs.database += Number(databaseSize) * pricing.storage.rds_gp3;

        // Backup storage (assume 100% of DB size for backups)
        costs.backup = Number(databaseSize) * pricing.storage.rds_gp3 * 0.5; // Backup storage is ~50% of primary
      }

      // S3 storage
      costs.storage = Number(s3Storage) * pricing.storage.s3_standard;

      // Data transfer
      const transfer = Number(dataTransfer);
      if (transfer <= 10000) {
        costs.dataTransfer = transfer * pricing.dataTransfer.first10TB;
      } else {
        costs.dataTransfer = 10000 * pricing.dataTransfer.first10TB + (transfer - 10000) * pricing.dataTransfer.next40TB;
      }

      // CloudFront (for scalable architecture)
      if (architecture === 'scalable') {
        costs.cdn = transfer * pricing.cloudfront.dataTransfer;
      }

      // CloudWatch monitoring
      costs.monitoring = users > 10000 ? 10 : 5; // Simplified

      const monthlyTotal = Object.values(costs).reduce((sum: number, cost) => sum + Number(cost), 0);
      const annualTotal = monthlyTotal * 12;

      // Calculate per-user costs
      const costPerUser = monthlyTotal / users;

      const results = {
        summary: {
          monthlyUsers: users,
          architecture,
          monthlyTotal: `$${monthlyTotal.toFixed(2)}`,
          annualTotal: `$${annualTotal.toFixed(2)}`,
          costPerUser: `$${costPerUser.toFixed(4)}`
        },
        breakdown: {
          compute: `$${costs.compute.toFixed(2)} (${computeType})`,
          database: architecture === 'simple' ? 'Included in compute' : `$${costs.database.toFixed(2)}`,
          storage: `$${costs.storage.toFixed(2)} (${s3Storage}GB S3)`,
          dataTransfer: `$${costs.dataTransfer.toFixed(2)} (${dataTransfer}GB/month)`,
          loadBalancer: costs.loadBalancer > 0 ? `$${costs.loadBalancer.toFixed(2)}` : 'N/A',
          cdn: costs.cdn > 0 ? `$${costs.cdn.toFixed(2)}` : 'N/A',
          backup: costs.backup > 0 ? `$${costs.backup.toFixed(2)}` : 'N/A',
          monitoring: `$${costs.monitoring.toFixed(2)}`
        },
        scaling: {
          at1k: `$${this.estimateForUsers(1000, architecture).toFixed(2)}/mo`,
          at10k: `$${this.estimateForUsers(10000, architecture).toFixed(2)}/mo`,
          at100k: `$${this.estimateForUsers(100000, architecture).toFixed(2)}/mo`,
          at1M: `$${this.estimateForUsers(1000000, architecture).toFixed(2)}/mo`
        },
        recommendations: this.generateRecommendations(users, architecture, monthlyTotal),
        alternatives: this.compareAlternatives(monthlyTotal, users)
      };

      console.log(`[AWSCostEstimator] Estimated monthly cost: $${monthlyTotal.toFixed(2)}`);

      return this.success(results);
    } catch (error) {
      return this.error(`AWS cost estimation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private estimateForUsers(users: number, architecture: string): number {
    // Simplified scaling calculation
    const baseInstanceCost = 29.95;
    const instanceCount = architecture === 'scalable' ? Math.max(2, Math.ceil(users / 10000)) : (architecture === 'standard' ? 2 : 1);
    const compute = baseInstanceCost * instanceCount;
    const database = architecture === 'simple' ? 0 : (users > 50000 ? 48.96 : 24.48) + 10;
    const storage = users / 1000 * 0.5; // 0.5GB S3 per 1K users
    const transfer = users / 1000 * 1 * 0.09; // 1GB transfer per 1K users
    const loadBalancer = architecture === 'scalable' ? 22.50 : 0;

    return compute + database + storage + transfer + loadBalancer + 10; // +10 for monitoring/misc
  }

  private generateRecommendations(users: number, architecture: string, monthlyCost: number): string[] {
    const recommendations: string[] = [];

    // Architecture recommendations
    if (users < 1000 && architecture !== 'simple') {
      recommendations.push('💡 Over-engineered: Simple architecture sufficient for <1K users. Consider downgrading to save costs.');
    } else if (users > 50000 && architecture === 'simple') {
      recommendations.push('⚠️  Under-provisioned: Standard or scalable architecture recommended for 50K+ users.');
    } else if (users > 100000 && architecture !== 'scalable') {
      recommendations.push('🚀 Scale up: Scalable architecture with auto-scaling recommended for 100K+ users.');
    }

    // Cost optimization
    if (monthlyCost > users * 0.01) {
      recommendations.push('💰 High per-user cost: Optimize compute and storage to reduce infrastructure spend.');
    }

    // Specific optimizations
    recommendations.push('📊 Reserved Instances: Save up to 72% with 3-year RIs vs on-demand pricing.');
    recommendations.push('🔄 Spot Instances: Use for background jobs to save up to 90% on compute.');

    if (architecture === 'scalable') {
      recommendations.push('⚡ CloudFront: Already included. Ensure edge caching is optimized to reduce origin requests.');
    } else {
      recommendations.push('🌍 Add CloudFront: CDN can reduce data transfer costs and improve performance.');
    }

    recommendations.push('📦 S3 Intelligent-Tiering: Auto-move infrequently accessed data to cheaper storage classes.');

    return recommendations;
  }

  private compareAlternatives(awsCost: number, users: number): Array<{ provider: string; estimatedCost: string; notes: string }> {
    return [
      {
        provider: 'AWS',
        estimatedCost: `$${awsCost.toFixed(2)}/mo`,
        notes: 'Baseline (full control, pay-as-you-go)'
      },
      {
        provider: 'Vercel Pro',
        estimatedCost: users < 100000 ? '$20/mo' : '$150-300/mo',
        notes: 'Serverless, great DX, expensive at scale'
      },
      {
        provider: 'Railway',
        estimatedCost: users < 10000 ? '$20-50/mo' : '$100-200/mo',
        notes: 'Simple, good for small apps, limited scaling'
      },
      {
        provider: 'DigitalOcean',
        estimatedCost: `$${(awsCost * 0.7).toFixed(2)}/mo`,
        notes: '~30% cheaper than AWS, simpler pricing'
      },
      {
        provider: 'Hetzner',
        estimatedCost: `$${(awsCost * 0.5).toFixed(2)}/mo`,
        notes: '~50% cheaper, excellent value, EU-focused'
      },
      {
        provider: 'Supabase',
        estimatedCost: users < 50000 ? '$25/mo (Pro)' : '$599+/mo (Team+)',
        notes: 'Backend-as-a-service, includes DB + Auth + Storage'
      }
    ];
  }
}
