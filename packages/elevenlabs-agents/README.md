# @repo/elevenlabs-agents

ElevenLabs Conversational AI agent management package for the Hacktogone 2025 project.

## Features

- List and retrieve ElevenLabs agents
- Import/export agent configurations
- Type-safe agent management with Zod validation
- Error handling with custom error types

## Installation

This package is part of the monorepo and is automatically available to other packages.

## Usage

```typescript
import { AgentClient, exportAgents, importAgents } from "@repo/elevenlabs-agents";

// Create a client
const client = new AgentClient(process.env.ELEVENLABS_API_KEY);

// List all agents
const agents = await client.listAgents();

// Get a specific agent
const agent = await client.getAgent("agent_id");

// Export agents to JSON
const json = exportAgents([agent]);

// Import agents from JSON
const imported = importAgents(json);
```

## CLI

The package includes the ElevenLabs CLI as a dev dependency:

```bash
bun run elevenlabs --help
```

## Development

```bash
# Type check
bun run typecheck

# Lint
bun run lint
```
