/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Base Tool Interface
 * All tools must extend this base class for auto-discovery and execution
 */

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object';
  description: string;
  required: boolean;
  default?: any;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    duration: number;
    cost: number;
    source: string;
  };
}

const TOOL_TIMEOUT_MS = Number(Deno.env.get('TOOL_TIMEOUT_MS') || 15000);

export abstract class BaseTool {
  abstract name: string;
  abstract description: string;
  abstract parameters: ToolParameter[];

  abstract execute(params: Record<string, any>): Promise<ToolResult>;

  validate(params: Record<string, any>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    this.parameters.forEach(param => {
      if (param.required && !(param.name in params)) {
        errors.push(`Missing required parameter: ${param.name}`);
      }

      if (param.name in params) {
        const value = params[param.name];
        const actualType = typeof value;

        if (param.type === 'object' && typeof value !== 'object') {
          errors.push(`Parameter ${param.name} must be an object`);
        } else if (param.type !== 'object' && actualType !== param.type) {
          errors.push(`Parameter ${param.name} must be ${param.type}, got ${actualType}`);
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Fetch wrapper with timeout to avoid long-running tool calls.
   */
  protected async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs = TOOL_TIMEOUT_MS
  ): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Format tool for LLM prompt
   */
  toPromptString(): string {
    const params = this.parameters.map(p => {
      const required = p.required ? '(required)' : '(optional)';
      const defaultVal = p.default !== undefined ? ` [default: ${p.default}]` : '';
      return `  - ${p.name} (${p.type}) ${required}: ${p.description}${defaultVal}`;
    }).join('\n');

    return `${this.name}: ${this.description}\nParameters:\n${params}`;
  }
}
