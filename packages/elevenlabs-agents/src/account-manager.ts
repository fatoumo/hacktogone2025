import type { Account, AgentConfig, AgentListItem } from "./types";
import { AgentClient } from "./client";
import { FileStorage } from "./file-storage";
import { AgentError } from "./types";

/**
 * Account Manager
 * Manages multiple ElevenLabs accounts and their operations
 */
export class AccountManager {
  private storage: FileStorage;
  private clients: Map<string, AgentClient> = new Map();
  private accounts: Map<string, Account> = new Map();

  constructor(storage?: FileStorage) {
    this.storage = storage || new FileStorage();
  }

  /**
   * Initialize the account manager by loading accounts
   */
  async initialize(): Promise<void> {
    const accounts = await this.storage.loadAccounts();

    for (const account of accounts) {
      this.accounts.set(account.id, account);

      // Initialize client if API key is available in environment
      const apiKey = process.env[account.env_key];
      if (apiKey && account.enabled) {
        try {
          this.clients.set(account.id, new AgentClient(apiKey));
        } catch (error) {
          console.warn(
            `Failed to initialize client for ${account.id}: ${error}`
          );
        }
      }
    }
  }

  /**
   * Get all configured accounts
   */
  getAccounts(): Account[] {
    return Array.from(this.accounts.values());
  }

  /**
   * Get a specific account by ID
   */
  getAccount(accountId: string): Account | null {
    return this.accounts.get(accountId) || null;
  }

  /**
   * Get the client for a specific account
   */
  getClient(accountId: string): AgentClient {
    const client = this.clients.get(accountId);
    if (!client) {
      throw new AgentError(
        `No client available for account ${accountId}. Check API key configuration.`,
        "MISSING_CLIENT"
      );
    }
    return client;
  }

  /**
   * Check if an account has a configured client
   */
  hasClient(accountId: string): boolean {
    return this.clients.has(accountId);
  }

  /**
   * Add or update a client for an account (useful for runtime configuration)
   */
  setClient(accountId: string, apiKey: string): void {
    const account = this.accounts.get(accountId);
    if (!account) {
      throw new AgentError(
        `Account ${accountId} not found`,
        "ACCOUNT_NOT_FOUND"
      );
    }

    this.clients.set(accountId, new AgentClient(apiKey));
  }

  /**
   * List agents from a specific account
   */
  async listAgentsFromAccount(accountId: string): Promise<AgentListItem[]> {
    const client = this.getClient(accountId);
    return await client.listAgents();
  }

  /**
   * Get an agent from a specific account
   */
  async getAgentFromAccount(
    accountId: string,
    agentId: string
  ): Promise<AgentConfig> {
    const client = this.getClient(accountId);
    return await client.getAgent(agentId);
  }

  /**
   * Pull agents from ElevenLabs API and save to local storage
   */
  async pullAgents(accountId: string): Promise<AgentConfig[]> {
    const client = this.getClient(accountId);
    const agentList = await client.listAgents();

    const agents: AgentConfig[] = [];

    for (const item of agentList) {
      try {
        const agent = await client.getAgent(item.agent_id);
        await this.storage.saveAgent(accountId, item.agent_id, agent);
        agents.push(agent);
        console.log(
          `✓ Pulled agent ${item.name} (${item.agent_id}) from ${accountId}`
        );
      } catch (error) {
        console.error(
          `✗ Failed to pull agent ${item.agent_id} from ${accountId}:`,
          error
        );
      }
    }

    return agents;
  }

  /**
   * Load agents from local storage for an account
   */
  async loadLocalAgents(accountId: string): Promise<AgentConfig[]> {
    return await this.storage.listAgents(accountId);
  }

  /**
   * Get account statistics
   */
  async getAccountStats(accountId: string): Promise<{
    account: Account;
    localAgentCount: number;
    remoteAgentCount: number;
    hasClient: boolean;
  }> {
    const account = this.getAccount(accountId);
    if (!account) {
      throw new AgentError(
        `Account ${accountId} not found`,
        "ACCOUNT_NOT_FOUND"
      );
    }

    const localAgents = await this.storage.listAgents(accountId);
    let remoteAgentCount = 0;

    if (this.hasClient(accountId)) {
      try {
        const remoteAgents = await this.listAgentsFromAccount(accountId);
        remoteAgentCount = remoteAgents.length;
      } catch (error) {
        console.warn(`Failed to fetch remote agent count: ${error}`);
      }
    }

    return {
      account,
      localAgentCount: localAgents.length,
      remoteAgentCount,
      hasClient: this.hasClient(accountId),
    };
  }

  /**
   * Get statistics for all accounts
   */
  async getAllAccountStats() {
    const stats = [];

    for (const accountId of this.accounts.keys()) {
      try {
        const accountStats = await this.getAccountStats(accountId);
        stats.push(accountStats);
      } catch (error) {
        console.error(`Failed to get stats for ${accountId}:`, error);
      }
    }

    return stats;
  }

  /**
   * Validate account configuration
   */
  validateAccount(accountId: string): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    const account = this.accounts.get(accountId);

    if (!account) {
      return {
        valid: false,
        issues: [`Account ${accountId} not found`],
      };
    }

    if (!account.enabled) {
      issues.push(`Account ${accountId} is disabled`);
    }

    const apiKey = process.env[account.env_key];
    if (!apiKey) {
      issues.push(
        `Environment variable ${account.env_key} not set for ${accountId}`
      );
    }

    if (!this.hasClient(accountId)) {
      issues.push(`No client available for ${accountId}`);
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Get API key for an account from environment
   */
  getApiKey(accountId: string): string | undefined {
    const account = this.accounts.get(accountId);
    if (!account) {
      return undefined;
    }
    return process.env[account.env_key];
  }
}
