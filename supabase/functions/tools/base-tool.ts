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
