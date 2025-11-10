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
 * Push command - Push local agents to ElevenLabs API
 */
export function createPushCommand(): Command {
  const push = new Command("push")
    .description("Push local agent configurations to ElevenLabs API")
    .argument("<account-id>", "Account ID to push to")
    .argument(
      "[agent-id]",
      "Specific agent ID to push (optional, pushes all if omitted)"
    )
    .option("--dry-run", "Preview push without executing")
    .option("-v, --verbose", "Verbose output")
    .action(
      async (
        accountId: string,
        agentId?: string,
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

          // Validate account
          const account = accountManager.getAccount(accountId);
          if (!account) {
            console.error(chalk.red(`\n❌ Account ${accountId} not found\n`));
            process.exit(1);
          }

          if (!accountManager.hasClient(accountId)) {
            console.error(
              chalk.red(
                `\n❌ No API key configured for ${accountId} (${account.env_key})\n`
              )
            );
            process.exit(1);
          }

          console.log(chalk.bold("\n📤 Push to ElevenLabs API\n"));
          console.log(chalk.cyan(`Account: ${account.name} (${accountId})`));

          if (options?.dryRun) {
            console.log(
              chalk.yellow("\n⚠️  DRY RUN MODE - No changes will be made\n")
            );
          }

          // Get agents to push
          const localAgents = await storage.listAgents(accountId);
          const agentsToPush = agentId
            ? localAgents.filter(
                (a: { agent_id: string }) => a.agent_id === agentId
              )
            : localAgents;

          if (agentsToPush.length === 0) {
            console.log(
              chalk.yellow(
                `\n⚠️  No agents found to push. Run 'pull' first or check agent ID.\n`
              )
            );
            process.exit(1);
          }

          console.log(chalk.cyan(`Agents to push: ${agentsToPush.length}\n`));

          // Note: Push is essentially deploying from local to the same account
          // We deploy to the same account to update existing agents
          for (const agent of agentsToPush) {
            const pushSpinner = ora(`Pushing ${agent.name}...`).start();

            try {
              if (options?.dryRun) {
                pushSpinner.succeed(
                  chalk.dim(
                    `[DRY RUN] Would push ${agent.name} (${agent.agent_id})`
                  )
                );
              } else {
                // Deploy to same account (this will update the agent)
                await deploymentService.deployAgent(
                  accountId,
                  agent.agent_id,
                  [accountId],
                  { dryRun: false, skipValidation: true }
                );

                pushSpinner.succeed(
                  chalk.green(`✓ Pushed ${agent.name} (${agent.agent_id})`)
                );
              }
            } catch (error) {
              pushSpinner.fail(
                chalk.red(`✗ Failed to push ${agent.name}: ${error}`)
              );
            }
          }

          console.log(chalk.bold("\n✅ Push completed\n"));
        } catch (error) {
          spinner.stop();
          console.error(chalk.red(`\n❌ Error: ${error}\n`));
          process.exit(1);
        }
      }
    );

  return push;
}
