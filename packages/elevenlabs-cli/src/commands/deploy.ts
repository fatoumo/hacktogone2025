import { Command } from "commander";
import ora from "ora";
import chalk from "chalk";
import {
  AccountManager,
  DeploymentService,
  ResourceMapper,
  FileStorage,
} from "@repo/elevenlabs-agents/server";

/**
 * Deploy command - Deploy agents from source to target accounts
 */
export function createDeployCommand(): Command {
  const deploy = new Command("deploy")
    .description("Deploy agents from source account to target accounts")
    .argument("<source-account>", "Source account ID")
    .argument("<agent-id>", "Agent ID to deploy (or 'all' for all agents)")
    .argument("<target-accounts>", "Comma-separated target account IDs")
    .option("--dry-run", "Preview deployment without executing")
    .option("--skip-validation", "Skip pre-deployment validation")
    .option("--no-retry", "Disable retry on error")
    .option("--max-retries <n>", "Maximum retry attempts", "3")
    .option("--delay <ms>", "Delay between accounts (ms)", "2000")
    .option("-v, --verbose", "Verbose output")
    .action(
      async (
        sourceAccount: string,
        agentId: string,
        targetAccountsStr: string,
        options: {
          dryRun?: boolean;
          skipValidation?: boolean;
          retry?: boolean;
          maxRetries?: string;
          delay?: string;
          verbose?: boolean;
        }
      ) => {
        const spinner = ora("Initializing...").start();

        try {
          const storage = new FileStorage();
          const accountManager = new AccountManager(storage);
          const resourceMapper = new ResourceMapper(storage);

          await accountManager.initialize();
          await resourceMapper.initialize();

          const deploymentService = new DeploymentService(
            accountManager,
            resourceMapper,
            storage
          );

          spinner.stop();

          // Parse target accounts
          const targetAccounts = targetAccountsStr
            .split(",")
            .map((id) => id.trim());

          // Validate source account
          const sourceAcc = accountManager.getAccount(sourceAccount);
          if (!sourceAcc) {
            console.error(
              chalk.red(`\n❌ Source account ${sourceAccount} not found\n`)
            );
            process.exit(1);
          }

          // Validate target accounts
          for (const targetId of targetAccounts) {
            const targetAcc = accountManager.getAccount(targetId);
            if (!targetAcc) {
              console.error(
                chalk.red(`\n❌ Target account ${targetId} not found\n`)
              );
              process.exit(1);
            }
          }

          // Get agents to deploy
          let agentIds: string[];
          if (agentId === "all") {
            // Filter out any undefined agent_ids and ensure we have valid strings
            agentIds = (await storage.listAgents(sourceAccount))
              .map((a: { agent_id: string }) => a.agent_id)
              .filter(
                (id: string | undefined): id is string =>
                  typeof id === "string" && id.length > 0
              );
          } else {
            agentIds = [agentId];
          }

          if (agentIds.length === 0) {
            console.error(
              chalk.yellow(
                `\n⚠️  No agents found in ${sourceAccount}. Run 'pull' first.\n`
              )
            );
            process.exit(1);
          }

          console.log(chalk.bold("\n🚀 Agent Deployment\n"));
          console.log(
            chalk.cyan(`Source: ${sourceAcc.name} (${sourceAccount})`)
          );
          console.log(
            chalk.cyan(
              `Targets: ${targetAccounts.map((id) => accountManager.getAccount(id)?.name || id).join(", ")}`
            )
          );
          console.log(chalk.cyan(`Agents: ${agentIds.length}`));

          if (options.dryRun) {
            console.log(
              chalk.yellow("\n⚠️  DRY RUN MODE - No changes will be made\n")
            );
          }

          // Deployment options
          const deployOpts = {
            dryRun: options.dryRun || false,
            skipValidation: options.skipValidation || false,
            retryOnError: options.retry !== false,
            maxRetries: parseInt(options.maxRetries || "3", 10),
            delayBetweenAccounts: parseInt(options.delay || "2000", 10),
          };

          // Deploy agents
          if (agentIds.length === 1) {
            // Single agent deployment
            const agentId = agentIds[0];
            if (!agentId) {
              console.error(chalk.red(`\n❌ Invalid agent ID\n`));
              process.exit(1);
            }
            const deployment = await deploymentService.deployAgent(
              sourceAccount,
              agentId,
              targetAccounts,
              deployOpts
            );

            console.log(chalk.bold("\n✅ Deployment completed\n"));
            console.log(chalk.dim(`Deployment ID: ${deployment.id}`));
          } else {
            // Multiple agents deployment
            console.log(
              chalk.bold(`\n📦 Deploying ${agentIds.length} agents...\n`)
            );

            const deployments = await deploymentService.deployMultipleAgents(
              sourceAccount,
              agentIds,
              targetAccounts,
              deployOpts
            );

            console.log(chalk.bold("\n✅ Batch deployment completed\n"));
            console.log(chalk.dim(`Total deployments: ${deployments.length}`));

            const successful = deployments.filter(
              (d: { status: string }) => d.status === "completed"
            ).length;
            const failed = deployments.filter(
              (d: { status: string }) => d.status === "failed"
            ).length;
            const partial = deployments.filter(
              (d: { status: string }) => d.status === "partial"
            ).length;

            console.log(chalk.green(`  Successful: ${successful}`));
            if (partial > 0) {
              console.log(chalk.yellow(`  Partial: ${partial}`));
            }
            if (failed > 0) {
              console.log(chalk.red(`  Failed: ${failed}`));
            }
          }
        } catch (error) {
          spinner.stop();
          console.error(chalk.red(`\n❌ Error: ${error}\n`));
          process.exit(1);
        }
      }
    );

  return deploy;
}
