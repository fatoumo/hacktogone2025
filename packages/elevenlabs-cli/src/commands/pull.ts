import { Command } from "commander";
import ora from "ora";
import chalk from "chalk";
import {
  AccountManager,
  FileStorage,
  ResourceMapper,
} from "@repo/elevenlabs-agents/server";

/**
 * Pull command - Pull agents from ElevenLabs API to local storage
 */
export function createPullCommand(): Command {
  const pull = new Command("pull")
    .description("Pull agents from ElevenLabs API to local storage")
    .argument(
      "[account-id]",
      "Account ID to pull from (or 'all' for all accounts)"
    )
    .option("-v, --verbose", "Verbose output")
    .action(async (accountId?: string, options?: { verbose?: boolean }) => {
      const spinner = ora("Initializing...").start();

      try {
        const storage = new FileStorage();
        const accountManager = new AccountManager(storage);
        await accountManager.initialize();

        const accounts =
          accountId && accountId !== "all"
            ? [accountId]
            : accountManager.getAccounts().map((a: { id: string }) => a.id);

        spinner.stop();

        console.log(chalk.bold("\n📥 Pulling agents from ElevenLabs API\n"));

        for (const accId of accounts) {
          const account = accountManager.getAccount(accId);
          if (!account) {
            console.log(chalk.red(`✗ Account ${accId} not found`));
            continue;
          }

          // Validate account has client
          if (!accountManager.hasClient(accId)) {
            console.log(
              chalk.yellow(
                `⊘ Skipping ${account.name} - No API key configured (${account.env_key})`
              )
            );
            continue;
          }

          console.log(
            chalk.cyan(`\n→ Pulling from ${account.name} (${accId})`)
          );

          const pullSpinner = ora(`Fetching agents from ${accId}...`).start();

          try {
            const agents = await accountManager.pullAgents(accId);
            pullSpinner.stop();

            console.log(chalk.green(`✓ Pulled ${agents.length} agents`));

            if (options?.verbose) {
              agents.forEach((agent: { name: string; agent_id: string }) => {
                console.log(chalk.dim(`  - ${agent.name} (${agent.agent_id})`));
              });
            }
          } catch (error) {
            pullSpinner.stop();
            console.log(chalk.red(`✗ Failed to pull from ${accId}: ${error}`));
          }
        }

        console.log(chalk.bold("\n✅ Pull completed\n"));
      } catch (error) {
        spinner.stop();
        console.error(chalk.red(`\n❌ Error: ${error}\n`));
        process.exit(1);
      }
    });

  return pull;
}
