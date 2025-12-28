/**
 * React Hook for LLM Client Health Monitoring
 * Provides real-time provider health stats and circuit breaker status
 * Action 54: OpenRouter Automatic Failover
 */

import { useState, useEffect, useCallback } from 'react';
import { llmClient, LLMProvider, ProviderHealth, CircuitState } from '@/lib/llm-client';
import { scopedLogger } from '@/lib/logger';

const logger = scopedLogger('useLLMHealth');

/**
 * Provider stats for UI display
 */
export interface ProviderStats {
  name: LLMProvider;
  health: ProviderHealth;
  circuitState: CircuitState;
  successRate: number;
  consecutiveFailures: number;
  isAvailable: boolean;
}

/**
 * LLM health monitoring hook
 */
export interface LLMHealthStats {
  currentProvider: LLMProvider;
  providers: ProviderStats[];
  isHealthy: boolean;
  hasActiveCircuit: boolean;
  refreshStats: () => void;
  resetProvider: (provider: LLMProvider) => void;
}

/**
 * Hook to monitor LLM client health
 *
 * @param autoRefresh - Automatically refresh stats every N ms (default: 30000 = 30s)
 * @returns LLM health statistics and control functions
 *
 * @example
 * ```tsx
 * function DebugPanel() {
 *   const { currentProvider, providers, isHealthy, refreshStats } = useLLMHealth();
 *
 *   return (
 *     <div>
 *       <h3>Current Provider: {currentProvider}</h3>
 *       <button onClick={refreshStats}>Refresh</button>
 *       {providers.map(p => (
 *         <div key={p.name}>
 *           {p.name}: {p.health} ({p.successRate * 100}% success)
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useLLMHealth(autoRefresh: number | false = 30000): LLMHealthStats {
  const [stats, setStats] = useState<ReturnType<typeof llmClient.getStats>>(() =>
    llmClient.getStats()
  );

  const refreshStats = useCallback(() => {
    const newStats = llmClient.getStats();
    setStats(newStats);
    logger.debug('LLM health stats refreshed', { stats: newStats });
  }, []);

  const resetProvider = useCallback((provider: LLMProvider) => {
    llmClient.resetProvider(provider);
    refreshStats();
    logger.info(`Provider ${provider} reset`);
  }, [refreshStats]);

  // Auto-refresh stats on interval
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(refreshStats, autoRefresh);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshStats]);

  // Compute derived stats
  const isHealthy = stats.providers.every((p) => p.health !== 'down');
  const hasActiveCircuit = stats.providers.some((p) => p.circuitState === 'open');

  return {
    currentProvider: stats.currentProvider,
    providers: stats.providers.map((p) => ({
      ...p,
      isAvailable: p.health !== 'down' || p.circuitState !== 'open',
    })),
    isHealthy,
    hasActiveCircuit,
    refreshStats,
    resetProvider,
  };
}

/**
 * Hook to get simple health indicator
 * Useful for status badges or indicators
 *
 * @returns Simple health status
 *
 * @example
 * ```tsx
 * function StatusBadge() {
 *   const status = useLLMHealthStatus();
 *
 *   return (
 *     <div className={`badge ${status === 'healthy' ? 'green' : 'red'}`}>
 *       {status}
 *     </div>
 *   );
 * }
 * ```
 */
export function useLLMHealthStatus(): 'healthy' | 'degraded' | 'down' {
  const { providers } = useLLMHealth(10000); // Check every 10s

  const hasDown = providers.some((p) => p.health === 'down');
  const hasDegraded = providers.some((p) => p.health === 'degraded');

  if (hasDown) return 'down';
  if (hasDegraded) return 'degraded';
  return 'healthy';
}

/**
 * Hook to get provider-specific health
 *
 * @param provider - Provider to monitor
 * @returns Provider health status
 *
 * @example
 * ```tsx
 * function OpenRouterStatus() {
 *   const health = useProviderHealth('openrouter');
 *
 *   return <div>OpenRouter: {health}</div>;
 * }
 * ```
 */
export function useProviderHealth(provider: LLMProvider): ProviderHealth {
  const [health, setHealth] = useState<ProviderHealth>(() =>
    llmClient.getProviderHealth(provider)
  );

  useEffect(() => {
    // Update every 10 seconds
    const interval = setInterval(() => {
      setHealth(llmClient.getProviderHealth(provider));
    }, 10000);

    return () => clearInterval(interval);
  }, [provider]);

  return health;
}

/**
 * Hook to monitor circuit state
 *
 * @param provider - Provider to monitor
 * @returns Circuit breaker state
 *
 * @example
 * ```tsx
 * function CircuitStatus({ provider }: { provider: LLMProvider }) {
 *   const circuitState = useCircuitState(provider);
 *
 *   return (
 *     <div>
 *       Circuit: {circuitState}
 *       {circuitState === 'open' && ' ⚠️ Provider unavailable'}
 *     </div>
 *   );
 * }
 * ```
 */
export function useCircuitState(provider: LLMProvider): CircuitState {
  const [state, setState] = useState<CircuitState>(() =>
    llmClient.getCircuitState(provider)
  );

  useEffect(() => {
    // Update every 5 seconds
    const interval = setInterval(() => {
      setState(llmClient.getCircuitState(provider));
    }, 5000);

    return () => clearInterval(interval);
  }, [provider]);

  return state;
}
