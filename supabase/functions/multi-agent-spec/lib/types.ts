/**
 * Shared types for the multi-agent-spec function
 */
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const agentConfigSchema = z.object({
    id: z.string().optional(),
    agent: z.string().min(1).max(50),
    systemPrompt: z.string().min(1).max(2000),
    temperature: z.number().min(0).max(1),
    enabled: z.boolean(),
});

export type AgentConfig = z.infer<typeof agentConfigSchema>;

export const requestSchema = z.object({
    userInput: z.string()
        .min(1, 'Input required')
        .max(5000, 'Input too long')
        .optional(),
    stage: z.enum(['questions', 'research', 'challenge', 'synthesis', 'voting', 'spec']),
    userComment: z.string().max(1000).optional(),
    agentConfigs: z.array(agentConfigSchema).optional(),
    roundData: z.any().optional(),
});

export type RequestBody = z.infer<typeof requestSchema>;
