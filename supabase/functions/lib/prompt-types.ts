/**
 * TypeScript types for prompt management tables
 * Generated from database schema
 */

export interface Database {
  public: {
    Tables: {
      prompts: {
        Row: {
          id: string;
          name: string;
          content: string;
          version: number;
          category: 'agent' | 'question' | 'challenge' | 'debate' | 'spec';
          is_active: boolean;
          metadata: {
            agent_id?: string;
            temperature?: number;
            recommended_model?: string;
            default_count?: number;
            supports_variables?: boolean;
            variables?: string[];
            target_length?: string;
            sections?: number;
            default_challenges_per_finding?: number;
            [key: string]: any;
          };
          created_at: string;
          updated_at: string;
          created_by: string | null;
          avg_quality_score: number | null;
          total_uses: number;
          avg_cost_cents: number | null;
        };
        Insert: {
          id?: string;
          name: string;
          content: string;
          version?: number;
          category: 'agent' | 'question' | 'challenge' | 'debate' | 'spec';
          is_active?: boolean;
          metadata?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          avg_quality_score?: number | null;
          total_uses?: number;
          avg_cost_cents?: number | null;
        };
        Update: {
          id?: string;
          name?: string;
          content?: string;
          version?: number;
          category?: 'agent' | 'question' | 'challenge' | 'debate' | 'spec';
          is_active?: boolean;
          metadata?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          avg_quality_score?: number | null;
          total_uses?: number;
          avg_cost_cents?: number | null;
        };
      };
      prompt_versions: {
        Row: {
          id: string;
          prompt_id: string;
          version: number;
          content: string;
          metadata: Record<string, any>;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          prompt_id: string;
          version: number;
          content: string;
          metadata?: Record<string, any>;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          prompt_id?: string;
          version?: number;
          content?: string;
          metadata?: Record<string, any>;
          created_at?: string;
          created_by?: string | null;
        };
      };
      prompt_usage: {
        Row: {
          id: string;
          prompt_id: string;
          version: number;
          session_id: string | null;
          quality_score: number | null;
          cost_cents: number | null;
          latency_ms: number | null;
          model_used: string | null;
          tokens_input: number | null;
          tokens_output: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          prompt_id: string;
          version: number;
          session_id?: string | null;
          quality_score?: number | null;
          cost_cents?: number | null;
          latency_ms?: number | null;
          model_used?: string | null;
          tokens_input?: number | null;
          tokens_output?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          prompt_id?: string;
          version?: number;
          session_id?: string | null;
          quality_score?: number | null;
          cost_cents?: number | null;
          latency_ms?: number | null;
          model_used?: string | null;
          tokens_input?: number | null;
          tokens_output?: number | null;
          created_at?: string;
        };
      };
    };
  };
}

export type PromptRow = Database['public']['Tables']['prompts']['Row'];
export type PromptInsert = Database['public']['Tables']['prompts']['Insert'];
export type PromptUpdate = Database['public']['Tables']['prompts']['Update'];

export type PromptVersionRow = Database['public']['Tables']['prompt_versions']['Row'];
export type PromptUsageRow = Database['public']['Tables']['prompt_usage']['Row'];
export type PromptUsageInsert = Database['public']['Tables']['prompt_usage']['Insert'];
