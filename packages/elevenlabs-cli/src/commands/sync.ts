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
 * Sync command - Sync agent updates across all accounts
 */
export function createSyncCommand(): Command {
  const sync = new Command("sync")
    .description("Sync agent updates from source to all target accounts")
    .argument("<agent-id>", "Agent ID to sync")
    .argument(
      "[source-account]",
      "Source account ID (defaults to first account with the agent)"
    )
    .option("--dry-run", "Preview sync without executing")
    .option("-v, --verbose", "Verbose output")
    .action(
      async (
        agentId: string,
        sourceAccount?: string,
        options?: {
          dryRun?: boolean;
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

          console.log(chalk.bold("\n🔄 Syncing agent across accounts\n"));

          // Find source account if not provided
          let srcAccount = sourceAccount;
          if (!srcAccount) {
            const accounts = accountManager.getAccounts();
            for (const account of accounts) {
              try {
                await storage.loadAgent(account.id, agentId);
                srcAccount = account.id;
                break;
              } catch {
                continue;
              }
            }

            if (!srcAccount) {
              console.error(
                chalk.red(
                  `\n❌ Agent ${agentId} not found in any account. Run 'pull' first.\n`
                )
              );
              process.exit(1);
            }
          }

          // Load agent
          let agent;
          try {
            agent = await storage.loadAgent(srcAccount, agentId);
          } catch (error) {
            console.error(
              chalk.red(`\n❌ Agent ${agentId} not found in ${srcAccount}\n`)
            );
            process.exit(1);
          }

          console.log(chalk.cyan(`Agent: ${agent.name} (${agentId})`));
          console.log(chalk.cyan(`Source: ${srcAccount}\n`));

          if (options?.dryRun) {
            console.log(
              chalk.yellow("⚠️  DRY RUN MODE - No changes will be made\n")
            );
          }

          // Get all other accounts as targets
          const allAccounts = accountManager
            .getAccounts()
            .map((a: { id: string }) => a.id);
          const targetAccounts = allAccounts.filter(
            (id: string) => id !== srcAccount
          );

          if (targetAccounts.length === 0) {
            console.log(chalk.yellow("\n⚠️  No target accounts to sync to\n"));
            process.exit(0);
          }

          console.log(
            chalk.cyan(
              `Syncing to: ${targetAccounts.map((id: string) => accountManager.getAccount(id)?.name || id).join(", ")}\n`
            )
          );

          // Deploy agent to all target accounts
          const deployment = await deploymentService.deployAgent(
            srcAccount,
            agentId,
            targetAccounts,
            {
              dryRun: options?.dryRun || false,
              skipValidation: false,
              retryOnError: true,
              maxRetries: 3,
              delayBetweenAccounts: 2000,
            }
          );

          console.log(chalk.bold("\n✅ Sync completed\n"));
          console.log(chalk.dim(`Deployment ID: ${deployment.id}`));
        } catch (error) {
          spinner.stop();
          console.error(chalk.red(`\n❌ Error: ${error}\n`));
          process.exit(1);
        }
      }
    );

  return sync;
}
