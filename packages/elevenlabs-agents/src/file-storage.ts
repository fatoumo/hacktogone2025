import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { existsSync } from "node:fs";
import type {
  Account,
  AgentConfig,
  Deployment,
  DeploymentStatus,
} from "./types";
import { AccountSchema, DeploymentSchema } from "./types";

/**
 * File Storage Service
 * Manages reading and writing to the agents-data directory
 */
export class FileStorage {
  private dataDir: string;

  constructor(dataDir?: string) {
    // Default to agents-data in project root
    this.dataDir = dataDir || join(process.cwd(), "agents-data");
  }

  /**
   * Get the path to the agents-data directory
   */
  getDataDir(): string {
    return this.dataDir;
  }

  /**
   * Ensure a directory exists, create if not
   */
  private async ensureDir(dirPath: string): Promise<void> {
    if (!existsSync(dirPath)) {
      await mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * Load accounts from accounts.json
   */
  async loadAccounts(): Promise<Account[]> {
    try {
      const filePath = join(this.dataDir, "accounts.json");
      const content = await readFile(filePath, "utf-8");
      const data = JSON.parse(content);
      return data.accounts.map((acc: unknown) => AccountSchema.parse(acc));
    } catch (error) {
      throw new Error(`Failed to load accounts: ${error}`);
    }
  }

  /**
   * Save accounts to accounts.json
   */
  async saveAccounts(accounts: Account[]): Promise<void> {
    try {
      const filePath = join(this.dataDir, "accounts.json");
      const data = {
        version: "1.0.0",
        accounts,
      };
      await writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      throw new Error(`Failed to save accounts: ${error}`);
    }
  }

  /**
   * Get a specific account by ID
   */
  async getAccount(accountId: string): Promise<Account | null> {
    const accounts = await this.loadAccounts();
    return accounts.find((acc) => acc.id === accountId) || null;
  }

  /**
   * Load deployments from deployments.json
   */
  async loadDeployments(): Promise<Deployment[]> {
    try {
      const filePath = join(this.dataDir, "deployments.json");
      const content = await readFile(filePath, "utf-8");
      const data = JSON.parse(content);

      // If no deployments, return empty array
      if (!data.deployments) {
        return [];
      }

      // Ensure each deployment has required fields with defaults
      return data.deployments.map((dep: unknown) => {
        const parsedDeployment = DeploymentSchema.parse(dep);
        return {
          ...parsedDeployment,
          results: parsedDeployment.results || [],
          created_at: parsedDeployment.created_at || new Date().toISOString(),
          updated_at: parsedDeployment.updated_at || new Date().toISOString(),
          status: parsedDeployment.status || "pending",
        };
      });
    } catch (error) {
      throw new Error(`Failed to load deployments: ${error}`);
    }
  }

  /**
   * Save deployments to deployments.json
   */
  async saveDeployments(deployments: Deployment[]): Promise<void> {
    try {
      const filePath = join(this.dataDir, "deployments.json");
      const data = {
        version: "1.0.0",
        deployments,
      };
      await writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      throw new Error(`Failed to save deployments: ${error}`);
    }
  }

  /**
   * Add a new deployment record
   */
  async addDeployment(deployment: Deployment): Promise<void> {
    const deployments = await this.loadDeployments();
    deployments.push(deployment);
    await this.saveDeployments(deployments);
  }

  /**
   * Update an existing deployment record
   */
  async updateDeployment(
    deploymentId: string,
    updates: Partial<Deployment>
  ): Promise<void> {
    const deployments = await this.loadDeployments();
    const index = deployments.findIndex((d) => d.id === deploymentId);

    if (index === -1) {
      throw new Error(`Deployment ${deploymentId} not found`);
    }

    deployments[index] = DeploymentSchema.parse({
      ...deployments[index],
      ...updates,
      updated_at: new Date().toISOString(),
    });

    await this.saveDeployments(deployments);
  }

  /**
   * Load voice mappings from voice-mappings.json
   */
  async loadVoiceMappings(): Promise<Record<string, string>> {
    try {
      const filePath = join(this.dataDir, "voice-mappings.json");
      const content = await readFile(filePath, "utf-8");
      const data = JSON.parse(content);
      return data.mappings || {};
    } catch (error) {
      throw new Error(`Failed to load voice mappings: ${error}`);
    }
  }

  /**
   * Get default voice ID from voice-mappings.json
   */
  async getDefaultVoice(): Promise<string> {
    try {
      const filePath = join(this.dataDir, "voice-mappings.json");
      const content = await readFile(filePath, "utf-8");
      const data = JSON.parse(content);
      return data.default_voice || "cjVigY5qzO86Huf0OWal";
    } catch (error) {
      return "cjVigY5qzO86Huf0OWal";
    }
  }

  /**
   * Save voice mappings to voice-mappings.json
   */
  async saveVoiceMappings(mappings: Record<string, string>): Promise<void> {
    try {
      const filePath = join(this.dataDir, "voice-mappings.json");
      const content = await readFile(filePath, "utf-8");
      const data = JSON.parse(content);
      data.mappings = mappings;
      await writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      throw new Error(`Failed to save voice mappings: ${error}`);
    }
  }

  /**
   * Load an agent configuration from file
   */
  async loadAgent(accountId: string, agentId: string): Promise<AgentConfig> {
    try {
      const filePath = join(
        this.dataDir,
        "agents",
        accountId,
        `${agentId}.json`
      );
      const content = await readFile(filePath, "utf-8");
      return JSON.parse(content);
    } catch (error) {
      throw new Error(
        `Failed to load agent ${agentId} from ${accountId}: ${error}`
      );
    }
  }

  /**
   * Save an agent configuration to file
   */
  async saveAgent(
    accountId: string,
    agentId: string,
    config: AgentConfig
  ): Promise<void> {
    try {
      const agentsDir = join(this.dataDir, "agents", accountId);
      await this.ensureDir(agentsDir);

      const filePath = join(agentsDir, `${agentId}.json`);
      await writeFile(filePath, JSON.stringify(config, null, 2));
    } catch (error) {
      throw new Error(
        `Failed to save agent ${agentId} to ${accountId}: ${error}`
      );
    }
  }

  /**
   * List all agents for an account
   */
  async listAgents(accountId: string): Promise<AgentConfig[]> {
    try {
      const agentsDir = join(this.dataDir, "agents", accountId);

      if (!existsSync(agentsDir)) {
        return [];
      }

      const files = await readdir(agentsDir);
      const jsonFiles = files.filter((f) => f.endsWith(".json"));

      const agents: AgentConfig[] = [];
      for (const file of jsonFiles) {
        const content = await readFile(join(agentsDir, file), "utf-8");
        agents.push(JSON.parse(content));
      }

      return agents;
    } catch (error) {
      throw new Error(`Failed to list agents for ${accountId}: ${error}`);
    }
  }

  /**
   * Delete an agent configuration file
   */
  async deleteAgent(accountId: string, agentId: string): Promise<void> {
    try {
      const filePath = join(
        this.dataDir,
        "agents",
        accountId,
        `${agentId}.json`
      );

      const { unlink } = await import("node:fs/promises");
      await unlink(filePath);
    } catch (error) {
      throw new Error(
        `Failed to delete agent ${agentId} from ${accountId}: ${error}`
      );
    }
  }
}
