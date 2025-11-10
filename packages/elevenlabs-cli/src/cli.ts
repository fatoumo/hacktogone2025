#!/usr/bin/env node
import { Command } from "commander";
import { config } from "dotenv";
import chalk from "chalk";
import { createPullCommand } from "./commands/pull.js";
import { createPushCommand } from "./commands/push.js";
import { createDeployCommand } from "./commands/deploy.js";
import { createSyncCommand } from "./commands/sync.js";
import { createStatusCommand } from "./commands/status.js";

// Load environment variables
config();

const program = new Command();

program
  .name("elevenlabs-cli")
  .description("CLI for managing ElevenLabs agents across multiple accounts")
  .version("0.1.0");

// Add commands
program.addCommand(createPullCommand());
program.addCommand(createPushCommand());
program.addCommand(createDeployCommand());
program.addCommand(createSyncCommand());
program.addCommand(createStatusCommand());

// Show help if no command provided
if (process.argv.length === 2) {
  program.help();
}

// Parse arguments
program.parse(process.argv);
