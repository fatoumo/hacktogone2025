# ElevenLabs Agents Data Directory

This directory contains configuration and data for multi-account ElevenLabs agent management.

## Structure

```
agents-data/
├── accounts.json           # Configuration for 3 ElevenLabs accounts
├── deployments.json        # Deployment history and tracking
├── voice-mappings.json     # Voice ID mappings between accounts
├── agents/
│   ├── compte1/           # Agents synced from account 1
│   ├── compte2/           # Agents synced from account 2
│   └── compte3/           # Agents synced from account 3
└── README.md              # This file
```

## Files

### accounts.json
Contains configuration for all 3 ElevenLabs accounts:
- Account ID and name
- Tier information (Free, Starter, Creator, Pro, etc.)
- Rate limits (max concurrent requests, monthly character limit)
- Environment variable reference for API key

### deployments.json
Tracks all agent deployments between accounts:
- Deployment ID and timestamp
- Source and target accounts
- Agent configurations deployed
- Deployment status and results
- Error logs if any

### voice-mappings.json
Maps voice IDs between accounts for cross-account deployment:
- Source voice ID → Target voice ID mappings
- Default fallback voice ID
- Usage notes and documentation

### agents/
Each subdirectory contains JSON files for agents synced from that account:
- One JSON file per agent (named `{agent_id}.json`)
- Full agent configuration including conversation config, platform settings, workflow
- Automatically pulled via `bun agents:pull` command

## Usage

### Pull agents from an account
```bash
bun agents:pull compte1
```

### Deploy agents from one account to others
```bash
bun agents:deploy compte1 compte2,compte3
```

### Sync updates across all accounts
```bash
bun agents:sync <agent-id>
```

## Security

- **NEVER commit API keys** to this directory
- API keys should only be in `.env.local` (which is gitignored)
- `accounts.json` only references the environment variable name, not the actual key
- All agent configurations in `agents/` are safe to commit (no secrets)

## Git Workflow

All files in this directory are tracked by Git to maintain version history:
- Track changes to agent configurations over time
- Rollback to previous versions if needed
- Collaborate on agent development with team members
- Audit deployment history
