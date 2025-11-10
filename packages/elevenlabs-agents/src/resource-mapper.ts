import type { AgentConfig } from "./types";
import { FileStorage } from "./file-storage";
import { AgentClient } from "./client";

/**
 * Resource Mapper
 * Handles mapping of resources (voices, tools) between accounts
 */
export class ResourceMapper {
  private storage: FileStorage;
  private voiceMappings: Record<string, string> = {};
  private defaultVoice: string = "cjVigY5qzO86Huf0OWal";
  private voiceCache: Map<string, Set<string>> = new Map();

  constructor(storage: FileStorage) {
    this.storage = storage;
  }

  /**
   * Initialize the mapper by loading voice mappings
   */
  async initialize(): Promise<void> {
    this.voiceMappings = await this.storage.loadVoiceMappings();
    this.defaultVoice = await this.storage.getDefaultVoice();
  }

  /**
   * Check if a voice exists in a target account
   */
  async verifyVoiceExists(
    voiceId: string,
    accountId: string,
    apiKey: string
  ): Promise<boolean> {
    try {
      // Check cache first
      const cachedVoices = this.voiceCache.get(accountId);
      if (cachedVoices) {
        return cachedVoices.has(voiceId);
      }

      // Fetch voices from API
      const client = new AgentClient(apiKey);
      const elevenlabsClient = client.getClient();
      const voices = await elevenlabsClient.voices.getAll();

      // Cache the voice IDs
      const voiceIds = new Set(
        voices.voices.map((v: { voice_id: string }) => v.voice_id)
      );
      this.voiceCache.set(accountId, voiceIds as Set<string>);

      return voiceIds.has(voiceId);
    } catch (error) {
      console.error(
        `Failed to verify voice ${voiceId} in ${accountId}:`,
        error
      );
      return false;
    }
  }

  /**
   * Map a voice ID from source to target account
   */
  async mapVoice(
    sourceVoiceId: string,
    targetAccountId: string,
    targetApiKey: string
  ): Promise<string> {
    // Check if there's an explicit mapping
    if (this.voiceMappings[sourceVoiceId]) {
      return this.voiceMappings[sourceVoiceId];
    }

    // Check if the voice exists in the target account
    const exists = await this.verifyVoiceExists(
      sourceVoiceId,
      targetAccountId,
      targetApiKey
    );

    if (exists) {
      return sourceVoiceId;
    }

    // Fall back to default voice
    console.warn(
      `Voice ${sourceVoiceId} not found in ${targetAccountId}, using default voice ${this.defaultVoice}`
    );
    return this.defaultVoice;
  }

  /**
   * Add a voice mapping
   */
  async addVoiceMapping(
    sourceVoiceId: string,
    targetVoiceId: string
  ): Promise<void> {
    this.voiceMappings[sourceVoiceId] = targetVoiceId;
    await this.storage.saveVoiceMappings(this.voiceMappings);
  }

  /**
   * Remove a voice mapping
   */
  async removeVoiceMapping(sourceVoiceId: string): Promise<void> {
    delete this.voiceMappings[sourceVoiceId];
    await this.storage.saveVoiceMappings(this.voiceMappings);
  }

  /**
   * Get all voice mappings
   */
  getVoiceMappings(): Record<string, string> {
    return { ...this.voiceMappings };
  }

  /**
   * Map agent configuration for target account
   * Replaces voice IDs and tool IDs with target equivalents
   */
  async mapAgentConfig(
    config: AgentConfig,
    targetAccountId: string,
    targetApiKey: string
  ): Promise<AgentConfig> {
    const mappedConfig = JSON.parse(JSON.stringify(config)) as AgentConfig;

    // Map voice ID in conversation_config.tts
    if (mappedConfig.conversation_config?.tts?.voice_id) {
      const mappedVoice = await this.mapVoice(
        mappedConfig.conversation_config.tts.voice_id,
        targetAccountId,
        targetApiKey
      );
      mappedConfig.conversation_config.tts.voice_id = mappedVoice;
    }

    // Map legacy voice_id field (if present)
    if (mappedConfig.voice_id) {
      const mappedVoice = await this.mapVoice(
        mappedConfig.voice_id,
        targetAccountId,
        targetApiKey
      );
      mappedConfig.voice_id = mappedVoice;
    }

    // TODO: Map tool IDs (requires tool verification implementation)
    // For now, we keep tool IDs as-is and log warnings
    if (mappedConfig.conversation_config?.agent?.prompt?.tool_ids) {
      const toolIds = mappedConfig.conversation_config.agent.prompt.tool_ids;
      if (toolIds.length > 0) {
        console.warn(
          `Agent ${config.agent_id} uses ${toolIds.length} tools. Tool mapping not yet implemented.`
        );
      }
    }

    return mappedConfig;
  }

  /**
   * Validate agent configuration for target account
   * Returns list of issues that need to be resolved
   */
  async validateAgentConfig(
    config: AgentConfig,
    targetAccountId: string,
    targetApiKey: string
  ): Promise<string[]> {
    const issues: string[] = [];

    // Check voice ID
    const voiceId =
      config.conversation_config?.tts?.voice_id || config.voice_id;

    if (voiceId) {
      const voiceExists = await this.verifyVoiceExists(
        voiceId,
        targetAccountId,
        targetApiKey
      );

      if (!voiceExists && !this.voiceMappings[voiceId]) {
        issues.push(
          `Voice ${voiceId} not found in ${targetAccountId} and no mapping defined`
        );
      }
    }

    // Check tool IDs
    const toolIds = config.conversation_config?.agent?.prompt?.tool_ids || [];
    if (toolIds.length > 0) {
      issues.push(
        `Agent uses ${toolIds.length} tools - manual verification required`
      );
    }

    return issues;
  }

  /**
   * Clear the voice cache (useful after adding new voices)
   */
  clearCache(): void {
    this.voiceCache.clear();
  }
}
