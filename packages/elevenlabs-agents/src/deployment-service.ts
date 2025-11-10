import type {
  AgentConfig,
  Deployment,
  DeploymentResult,
  DeploymentStatus,
} from "./types";
import { AccountManager } from "./account-manager";
import { ResourceMapper } from "./resource-mapper";
import { FileStorage } from "./file-storage";
import { AgentError } from "./types";
import { randomUUID } from "node:crypto";

/**
 * Deployment Options
 */
export interface DeploymentOptions {
  dryRun?: boolean;
  skipValidation?: boolean;
  retryOnError?: boolean;
  maxRetries?: number;
  delayBetweenAccounts?: number;
}

/**
 * Deployment Service
 * Handles deployment of agents between accounts
 */
export class DeploymentService {
  private accountManager: AccountManager;
  private resourceMapper: ResourceMapper;
  private storage: FileStorage;

  constructor(
    accountManager: AccountManager,
    resourceMapper: ResourceMapper,
    storage?: FileStorage
  ) {
    this.accountManager = accountManager;
    this.resourceMapper = resourceMapper;
    this.storage = storage || new FileStorage();
  }

  /**
   * Create a deployment record
   */
  private createDeployment(
    sourceAccountId: string,
    sourceAgentId: string,
    agentName: string,
    targetAccounts: string[]
  ): Deployment {
    return {
      id: randomUUID(),
      source_account_id: sourceAccountId,
      source_agent_id: sourceAgentId,
      agent_name: agentName,
      target_accounts: targetAccounts,
      results: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: "pending" as DeploymentStatus,
    };
  }

  /**
   * Validate deployment before executing
   */
  async validateDeployment(
    sourceAccountId: string,
    sourceAgentId: string,
    targetAccounts: string[]
  ): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    // Validate source account
    const sourceValidation =
      this.accountManager.validateAccount(sourceAccountId);
    if (!sourceValidation.valid) {
      issues.push(...sourceValidation.issues);
    }

    // Validate target accounts
    for (const targetAccountId of targetAccounts) {
      const targetValidation =
        this.accountManager.validateAccount(targetAccountId);
      if (!targetValidation.valid) {
        issues.push(...targetValidation.issues);
      }
    }

    // Try to load source agent
    try {
      const agent = await this.storage.loadAgent(
        sourceAccountId,
        sourceAgentId
      );

      // Validate agent configuration for each target
      for (const targetAccountId of targetAccounts) {
        if (targetAccountId === sourceAccountId) {
          continue; // Skip validation for same account
        }

        const apiKey = this.accountManager.getApiKey(targetAccountId);
        if (!apiKey) {
          issues.push(`No API key for target account ${targetAccountId}`);
          continue;
        }

        const configIssues = await this.resourceMapper.validateAgentConfig(
          agent,
          targetAccountId,
          apiKey
        );

        if (configIssues.length > 0) {
          issues.push(
            `Issues for ${targetAccountId}: ${configIssues.join(", ")}`
          );
        }
      }
    } catch (error) {
      issues.push(`Failed to load source agent: ${error}`);
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Deploy agent to a single target account
   */
  private async deployToAccount(
    agentConfig: AgentConfig,
    targetAccountId: string,
    options: DeploymentOptions
  ): Promise<DeploymentResult> {
    const result: DeploymentResult = {
      account_id: targetAccountId,
      status: "pending" as DeploymentStatus,
      timestamp: new Date().toISOString(),
    };

    try {
      // Get API key for target account
      const apiKey = this.accountManager.getApiKey(targetAccountId);
      if (!apiKey) {
        throw new Error(`No API key available for ${targetAccountId}`);
      }

      // Map agent configuration for target account
      const mappedConfig = await this.resourceMapper.mapAgentConfig(
        agentConfig,
        targetAccountId,
        apiKey
      );

      if (options.dryRun) {
        console.log(
          `[DRY RUN] Would deploy agent ${mappedConfig.name} to ${targetAccountId}`
        );
        result.status = "completed" as DeploymentStatus;
        result.agent_id = "dry-run-" + randomUUID();
        return result;
      }

      // Create agent via API
      const client = this.accountManager.getClient(targetAccountId);
      const elevenlabsClient = client.getClient();

      // Prepare payload for agent creation
      const createPayload = {
        name: mappedConfig.name,
        conversation_config: {
          ...(mappedConfig.conversation_config || {}),
          tts: mappedConfig.conversation_config?.tts && {
            voice_id: mappedConfig.conversation_config.tts.voice_id,
            stability: mappedConfig.conversation_config.tts.stability,
            similarity_boost:
              mappedConfig.conversation_config.tts.similarity_boost,
            model_id: "eleven_multilingual_v2" as const, // Using a known valid model ID
          },
          llm: mappedConfig.conversation_config?.llm,
          turn_timeout: mappedConfig.conversation_config?.turn_timeout,
          max_duration: mappedConfig.conversation_config?.max_duration,
          agent: mappedConfig.conversation_config?.agent,
        },
        platform_settings: mappedConfig.platform_settings || {},
        workflow: mappedConfig.workflow || { nodes: [], edges: [] },
        tags: mappedConfig.tags || [],
      };

      // Call ElevenLabs API to create agent
      const createdAgent = await elevenlabsClient.conversationalAi.createAgent(
        createPayload as Parameters<
          typeof elevenlabsClient.conversationalAi.createAgent
        >[0]
      );

      result.status = "completed" as DeploymentStatus;
      result.agent_id = createdAgent.agent_id;

      // Save to local storage
      await this.storage.saveAgent(targetAccountId, createdAgent.agent_id, {
        ...mappedConfig,
        agent_id: createdAgent.agent_id,
      });

      console.log(
        `✓ Deployed agent ${mappedConfig.name} to ${targetAccountId} (${createdAgent.agent_id})`
      );
    } catch (error) {
      result.status = "failed" as DeploymentStatus;
      result.error = error instanceof Error ? error.message : String(error);
      console.error(`✗ Failed to deploy to ${targetAccountId}:`, error);
    }

    return result;
  }

  /**
   * Deploy agent from source account to multiple target accounts
   */
  async deployAgent(
    sourceAccountId: string,
    sourceAgentId: string,
    targetAccounts: string[],
    options: DeploymentOptions = {}
  ): Promise<Deployment> {
    // Set defaults
    const opts: Required<DeploymentOptions> = {
      dryRun: options.dryRun ?? false,
      skipValidation: options.skipValidation ?? false,
      retryOnError: options.retryOnError ?? false,
      maxRetries: options.maxRetries ?? 3,
      delayBetweenAccounts: options.delayBetweenAccounts ?? 2000,
    };

    // Load source agent
    const sourceAgent = await this.storage.loadAgent(
      sourceAccountId,
      sourceAgentId
    );

    // Create deployment record
    const deployment = this.createDeployment(
      sourceAccountId,
      sourceAgentId,
      sourceAgent.name,
      targetAccounts
    );

    console.log(`\n🚀 Starting deployment: ${deployment.id}`);
    console.log(`   Agent: ${sourceAgent.name} (${sourceAgentId})`);
    console.log(`   Source: ${sourceAccountId}`);
    console.log(`   Targets: ${targetAccounts.join(", ")}`);

    // Validate deployment
    if (!opts.skipValidation) {
      console.log("\n🔍 Validating deployment...");
      const validation = await this.validateDeployment(
        sourceAccountId,
        sourceAgentId,
        targetAccounts
      );

      if (!validation.valid) {
        console.error("❌ Validation failed:");
        validation.issues.forEach((issue) => console.error(`   - ${issue}`));

        deployment.status = "failed" as DeploymentStatus;
        deployment.notes = `Validation failed: ${validation.issues.join("; ")}`;
        await this.storage.addDeployment(deployment);

        throw new AgentError(
          "Deployment validation failed",
          "VALIDATION_FAILED",
          validation.issues
        );
      }

      console.log("✓ Validation passed");
    }

    // Deploy to each target account
    deployment.status = "in_progress" as DeploymentStatus;
    await this.storage.addDeployment(deployment);

    console.log("\n📤 Deploying to target accounts...");

    for (const targetAccountId of targetAccounts) {
      // Skip if deploying to same account
      if (targetAccountId === sourceAccountId) {
        console.log(`⊘ Skipping ${targetAccountId} (same as source)`);
        continue;
      }

      let result: DeploymentResult;
      let attempts = 0;

      // Retry loop
      do {
        attempts++;
        result = await this.deployToAccount(sourceAgent, targetAccountId, opts);

        if (
          result.status === "failed" &&
          opts.retryOnError &&
          attempts < opts.maxRetries
        ) {
          console.log(
            `⟳ Retrying ${targetAccountId} (attempt ${attempts + 1}/${opts.maxRetries})...`
          );
          await this.delay(opts.delayBetweenAccounts * attempts);
        } else {
          break;
        }
      } while (attempts < opts.maxRetries);

      deployment.results.push(result);

      // Delay between accounts (rate limiting)
      if (opts.delayBetweenAccounts > 0) {
        await this.delay(opts.delayBetweenAccounts);
      }
    }

    // Update final status
    const hasFailures = deployment.results.some(
      (r: DeploymentResult) => r.status === "failed"
    );
    const hasSuccesses = deployment.results.some(
      (r: DeploymentResult) => r.status === "completed"
    );

    if (hasFailures && hasSuccesses) {
      deployment.status = "partial" as DeploymentStatus;
    } else if (hasFailures) {
      deployment.status = "failed" as DeploymentStatus;
    } else {
      deployment.status = "completed" as DeploymentStatus;
    }

    deployment.updated_at = new Date().toISOString();
    await this.storage.updateDeployment(deployment.id, deployment);

    // Summary
    console.log("\n📊 Deployment Summary:");
    console.log(`   Status: ${deployment.status}`);
    console.log(
      `   Successes: ${deployment.results.filter((r: DeploymentResult) => r.status === "completed").length}`
    );
    console.log(
      `   Failures: ${deployment.results.filter((r: DeploymentResult) => r.status === "failed").length}`
    );

    return deployment;
  }

  /**
   * Deploy multiple agents at once
   */
  async deployMultipleAgents(
    sourceAccountId: string,
    agentIds: string[],
    targetAccounts: string[],
    options: DeploymentOptions = {}
  ): Promise<Deployment[]> {
    const deployments: Deployment[] = [];

    console.log(`\n📦 Batch deployment: ${agentIds.length} agents`);

    for (const agentId of agentIds) {
      try {
        const deployment = await this.deployAgent(
          sourceAccountId,
          agentId,
          targetAccounts,
          options
        );
        deployments.push(deployment);
      } catch (error) {
        console.error(`Failed to deploy agent ${agentId}:`, error);
      }
    }

    return deployments;
  }

  /**
   * Get deployment history
   */
  async getDeploymentHistory(limit?: number): Promise<Deployment[]> {
    const deployments = await this.storage.loadDeployments();

    // Sort by created_at descending
    deployments.sort(
      (a: Deployment, b: Deployment) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return limit ? deployments.slice(0, limit) : deployments;
  }

  /**
   * Get deployment by ID
   */
  async getDeployment(deploymentId: string): Promise<Deployment | null> {
    const deployments = await this.storage.loadDeployments();
    return deployments.find((d: Deployment) => d.id === deploymentId) || null;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
