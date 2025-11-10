import { ElevenLabsClient } from "elevenlabs";
import type { AgentConfig, AgentListItem } from "./types";
import { AgentError } from "./types";

/**
 * ElevenLabs Agent Client
 * Manages agent operations including listing, getting, and managing configurations
 */
export class AgentClient {
  private client: ElevenLabsClient;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new AgentError("ElevenLabs API key is required", "MISSING_API_KEY");
    }
    this.client = new ElevenLabsClient({ apiKey });
  }

  /**
   * List all available agents
   */
  async listAgents(): Promise<AgentListItem[]> {
    try {
      const response = await this.client.conversationalAi.getAgents();
      return response.agents.map((agent) => ({
        agent_id: agent.agent_id,
        name: agent.name || "Unnamed Agent",
      }));
    } catch (error) {
      throw new AgentError(
        "Failed to list agents",
        "LIST_AGENTS_FAILED",
        error
      );
    }
  }

  /**
   * Get a specific agent by ID
   */
  async getAgent(agentId: string): Promise<AgentConfig> {
    try {
      const agent = await this.client.conversationalAi.getAgent(agentId);
      return {
        agent_id: agent.agent_id,
        name: agent.name || "Unnamed Agent",
        description: (agent.conversation_config?.agent as any)?.prompt?.prompt,
        voice_id: (agent.conversation_config?.tts as any)?.voice_id,
        conversation_config: {},
        prompt: {
          prompt: (agent.conversation_config?.agent as any)?.prompt?.prompt,
          llm: (agent.conversation_config?.agent as any)?.prompt?.llm,
          temperature: (agent.conversation_config?.agent as any)?.prompt
            ?.temperature,
          max_tokens: (agent.conversation_config?.agent as any)?.prompt
            ?.max_tokens,
        },
      };
    } catch (error) {
      throw new AgentError(
        `Failed to get agent ${agentId}`,
        "GET_AGENT_FAILED",
        error
      );
    }
  }

  /**
   * Get the underlying ElevenLabs client for advanced operations
   */
  getClient(): ElevenLabsClient {
    return this.client;
  }
}
