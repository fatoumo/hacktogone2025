import { z } from "zod";

/**
 * ElevenLabs Account Configuration
 */
export const AccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  tier: z.string(),
  max_concurrent: z.number(),
  monthly_chars: z.number(),
  created_at: z.string(),
  enabled: z.boolean(),
  env_key: z.string(),
});

export type Account = z.infer<typeof AccountSchema>;

/**
 * Deployment Status
 */
export enum DeploymentStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  FAILED = "failed",
  PARTIAL = "partial",
}

/**
 * Deployment Result for a single agent to a single account
 */
export const DeploymentResultSchema = z.object({
  account_id: z.string(),
  agent_id: z.string().optional(),
  status: z.nativeEnum(DeploymentStatus),
  error: z.string().optional(),
  timestamp: z.string(),
});

export type DeploymentResult = z.infer<typeof DeploymentResultSchema>;

/**
 * Deployment Record
 */
export const DeploymentSchema = z.object({
  id: z.string(),
  source_account_id: z.string(),
  source_agent_id: z.string(),
  agent_name: z.string(),
  target_accounts: z.array(z.string()),
  results: z.array(DeploymentResultSchema),
  created_at: z.string(),
  updated_at: z.string(),
  status: z.nativeEnum(DeploymentStatus),
  notes: z.string().optional(),
});

export type Deployment = z.infer<typeof DeploymentSchema>;

/**
 * ElevenLabs Agent Configuration Schema (Enhanced)
 */
export const AgentConfigSchema = z.object({
  agent_id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  voice_id: z.string().optional(),
  conversation_config: z
    .object({
      agent: z
        .object({
          prompt: z
            .object({
              prompt: z.string().optional(),
              llm: z.string().optional(),
              temperature: z.number().optional(),
              max_tokens: z.number().optional(),
              tool_ids: z.array(z.string()).optional(),
            })
            .optional(),
          first_message: z.string().optional(),
          language: z.string().optional(),
          turn_eagerness: z.string().optional(),
          turn_timeout: z.number().optional(),
        })
        .optional(),
      tts: z
        .object({
          model_id: z.string().optional(),
          voice_id: z.string().optional(),
          stability: z.number().optional(),
          similarity_boost: z.number().optional(),
        })
        .optional(),
      llm: z
        .object({
          model: z.string().optional(),
          temperature: z.number().optional(),
          max_tokens: z.number().optional(),
        })
        .optional(),
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
  platform_settings: z
    .object({
      authentication: z
        .object({
          enabled: z.boolean().optional(),
          allowlist: z.array(z.string()).optional(),
        })
        .optional(),
      audio_format: z.string().optional(),
    })
    .optional(),
  workflow: z
    .object({
      nodes: z.array(z.any()).optional(),
      edges: z.array(z.any()).optional(),
    })
    .optional(),
  tags: z.array(z.string()).optional(),
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
