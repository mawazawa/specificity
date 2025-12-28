/**
 * LLM Health Monitor Component
 * Debug component to visualize provider health and failover status
 * Action 54: OpenRouter Automatic Failover
 */

import { useLLMHealth } from '@/hooks/use-llm-health';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CircleCheck, CircleAlert, CircleX, RefreshCw } from 'lucide-react';

/**
 * Health status badge component
 */
function HealthBadge({ health }: { health: 'healthy' | 'degraded' | 'down' }) {
  const config = {
    healthy: { icon: CircleCheck, className: 'bg-green-500', label: 'Healthy' },
    degraded: { icon: CircleAlert, className: 'bg-yellow-500', label: 'Degraded' },
    down: { icon: CircleX, className: 'bg-red-500', label: 'Down' },
  }[health];

  const Icon = config.icon;

  return (
    <Badge className={config.className}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
}

/**
 * Circuit state badge component
 */
function CircuitBadge({ state }: { state: 'closed' | 'open' | 'half-open' }) {
  const config = {
    closed: { className: 'bg-green-500', label: 'Closed' },
    'half-open': { className: 'bg-yellow-500', label: 'Half-Open' },
    open: { className: 'bg-red-500', label: 'Open' },
  }[state];

  return <Badge className={config.className}>{config.label}</Badge>;
}

/**
 * LLM Health Monitor Component
 * Displays real-time health metrics for LLM providers
 *
 * Usage:
 * ```tsx
 * // Add to your debug panel or settings page
 * <LLMHealthMonitor />
 * ```
 */
export function LLMHealthMonitor() {
  const { currentProvider, providers, isHealthy, hasActiveCircuit, refreshStats, resetProvider } =
    useLLMHealth();

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>LLM Provider Health</CardTitle>
            <CardDescription>Real-time monitoring of AI provider status</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={refreshStats}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall status */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div>
            <p className="text-sm font-medium">System Status</p>
            <p className="text-xs text-muted-foreground">Current Provider: {currentProvider}</p>
          </div>
          <div className="flex gap-2">
            <HealthBadge health={isHealthy ? 'healthy' : 'down'} />
            {hasActiveCircuit && (
              <Badge className="bg-orange-500">
                <CircleAlert className="w-3 h-3 mr-1" />
                Circuit Active
              </Badge>
            )}
          </div>
        </div>

        {/* Provider details */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Providers</p>
          {providers.map((provider) => (
            <div
              key={provider.name}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium capitalize">{provider.name}</p>
                  {provider.name === currentProvider && (
                    <Badge variant="outline" className="text-xs">
                      Active
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                  <span>Success Rate: {(provider.successRate * 100).toFixed(1)}%</span>
                  <span>Consecutive Failures: {provider.consecutiveFailures}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <HealthBadge health={provider.health} />
                <CircuitBadge state={provider.circuitState} />
                {provider.health !== 'healthy' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => resetProvider(provider.name)}
                    className="text-xs"
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            <strong>Circuit States:</strong> Closed = Normal operation, Half-Open = Testing recovery,
            Open = Provider unavailable
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact health indicator for header/navbar
 */
export function LLMHealthIndicator() {
  const { isHealthy, hasActiveCircuit } = useLLMHealth(10000);

  if (isHealthy && !hasActiveCircuit) {
    return null; // Don't show anything when everything is healthy
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1 text-xs bg-yellow-500/10 rounded-full">
      <CircleAlert className="w-3 h-3 text-yellow-500" />
      <span className="text-yellow-700">Provider Issues Detected</span>
    </div>
  );
}
