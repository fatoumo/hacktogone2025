import { z } from "zod";

/**
 * ElevenLabs Agent Configuration Schema
 */
export const AgentConfigSchema = z.object({
  agent_id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  voice_id: z.string().optional(),
  conversation_config: z
    .object({
      turn_timeout: z.number().optional(),
      max_duration: z.number().optional(),
    })
    .optional(),
  prompt: z
    .object({
      prompt: z.string().optional(),
      llm: z.string().optional(),
      temperature: z.number().optional(),
      max_tokens: z.number().optional(),
    })
    .optional(),
  language: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type AgentConfig = z.infer<typeof AgentConfigSchema>;

/**
 * Agent Import/Export Format
 */
export const AgentExportSchema = z.object({
  version: z.literal("1.0"),
  agents: z.array(AgentConfigSchema),
  exported_at: z.string(),
});

export type AgentExport = z.infer<typeof AgentExportSchema>;

/**
 * Agent List Response
 */
export interface AgentListItem {
  agent_id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Error types for agent operations
 */
export class AgentError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "AgentError";
  }
}
