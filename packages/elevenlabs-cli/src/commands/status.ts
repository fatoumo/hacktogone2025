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
 * Status command - View account status and deployment history
 */
export function createStatusCommand(): Command {
  const status = new Command("status")
    .description("View account status and deployment history")
    .option("-a, --accounts", "Show account statistics")
    .option(
      "-d, --deployments [limit]",
      "Show deployment history (default: 10)",
      "10"
    )
    .option("-v, --verbose", "Verbose output")
    .action(
      async (options: {
        accounts?: boolean;
        deployments?: string;
        verbose?: boolean;
      }) => {
        const spinner = ora("Loading...").start();

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

          // Show accounts if requested or if no option provided
          if (options.accounts || (!options.accounts && !options.deployments)) {
            console.log(chalk.bold("\n📊 Account Status\n"));

            const stats = await accountManager.getAllAccountStats();

            for (const stat of stats) {
              const statusIcon = stat.hasClient
                ? chalk.green("●")
                : chalk.red("●");

              console.log(
                `${statusIcon} ${chalk.bold(stat.account.name)} (${stat.account.id})`
              );
              console.log(
                chalk.dim(
                  `   Tier: ${stat.account.tier} | Max Concurrent: ${stat.account.max_concurrent}`
                )
              );
              console.log(
                chalk.dim(
                  `   Local agents: ${stat.localAgentCount} | Remote agents: ${stat.remoteAgentCount}`
                )
              );

              if (!stat.hasClient) {
                console.log(
                  chalk.yellow(
                    `   ⚠️  No API key configured (${stat.account.env_key})`
                  )
                );
              }

              console.log();
            }
          }

          // Show deployments if requested
          if (options.deployments) {
            const limit = parseInt(options.deployments, 10);
            const deployments =
              await deploymentService.getDeploymentHistory(limit);

            console.log(
              chalk.bold(
                `\n📜 Recent Deployments (showing ${Math.min(limit, deployments.length)})\n`
              )
            );

            if (deployments.length === 0) {
              console.log(chalk.dim("  No deployments yet\n"));
              return;
            }

            for (const deployment of deployments) {
              const statusColor =
                deployment.status === "completed"
                  ? chalk.green
                  : deployment.status === "failed"
                    ? chalk.red
                    : deployment.status === "partial"
                      ? chalk.yellow
                      : chalk.blue;

              console.log(
                `${statusColor("●")} ${chalk.bold(deployment.agent_name)} (${deployment.id.slice(0, 8)})`
              );
              console.log(
                chalk.dim(
                  `   ${deployment.source_account_id} → ${deployment.target_accounts.join(", ")}`
                )
              );
              console.log(
                chalk.dim(
                  `   Status: ${statusColor(deployment.status)} | ${new Date(deployment.created_at).toLocaleString()}`
                )
              );

              if (options.verbose && deployment.results.length > 0) {
                console.log(chalk.dim("   Results:"));
                for (const result of deployment.results) {
                  const resultIcon =
                    result.status === "completed"
                      ? chalk.green("✓")
                      : chalk.red("✗");
                  console.log(
                    chalk.dim(
                      `     ${resultIcon} ${result.account_id}: ${result.status}${result.error ? ` - ${result.error}` : ""}`
                    )
                  );
                }
              }

              console.log();
            }
          }
        } catch (error) {
          spinner.stop();
          console.error(chalk.red(`\n❌ Error: ${error}\n`));
          process.exit(1);
        }
      }
    );

  return status;
}
