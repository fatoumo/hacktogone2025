# @repo/elevenlabs-cli

CLI tool for managing ElevenLabs agents across multiple accounts.

## Installation

```bash
cd packages/elevenlabs-cli
bun install
bun run build
```

## Usage

### Pull agents from ElevenLabs API

```bash
# Pull from all accounts
bun elevenlabs-cli pull all

# Pull from specific account
bun elevenlabs-cli pull compte1

# Verbose output
bun elevenlabs-cli pull compte1 -v
```

### Deploy agents between accounts

```bash
# Deploy single agent to multiple accounts
bun elevenlabs-cli deploy compte1 agent_abc123 compte2,compte3

# Deploy all agents from compte1 to compte2 and compte3
bun elevenlabs-cli deploy compte1 all compte2,compte3

# Dry run (preview without executing)
bun elevenlabs-cli deploy compte1 agent_abc123 compte2 --dry-run

# Skip validation
bun elevenlabs-cli deploy compte1 agent_abc123 compte2 --skip-validation
```

### Push local changes to ElevenLabs

```bash
# Push all local agents to compte1
bun elevenlabs-cli push compte1

# Push specific agent
bun elevenlabs-cli push compte1 agent_abc123
```

### Sync agent across all accounts

```bash
# Sync agent from source to all other accounts
bun elevenlabs-cli sync agent_abc123 compte1

# Auto-detect source account
bun elevenlabs-cli sync agent_abc123
```

### View status and history

```bash
# Show account status
bun elevenlabs-cli status --accounts

# Show deployment history (last 10)
bun elevenlabs-cli status --deployments

# Show last 20 deployments with verbose details
bun elevenlabs-cli status --deployments 20 -v

# Show both
bun elevenlabs-cli status
```

## Environment Variables

Configure API keys in `.env.local`:

```bash
ELEVENLABS_ACCOUNT1_KEY=sk_...
ELEVENLABS_ACCOUNT2_KEY=sk_...
ELEVENLABS_ACCOUNT3_KEY=sk_...
```

## Commands

### `pull [account-id]`

Pull agents from ElevenLabs API to local storage (`agents-data/`).

**Options:**
- `-v, --verbose` - Show detailed output

**Examples:**
```bash
bun elevenlabs-cli pull all
bun elevenlabs-cli pull compte1 -v
```

### `push <account-id> [agent-id]`

Push local agent configurations to ElevenLabs API.

**Options:**
- `--dry-run` - Preview without executing
- `-v, --verbose` - Show detailed output

**Examples:**
```bash
bun elevenlabs-cli push compte1
bun elevenlabs-cli push compte1 agent_abc123 --dry-run
```

### `deploy <source-account> <agent-id> <target-accounts>`

Deploy agents from source account to target accounts.

**Arguments:**
- `source-account` - Source account ID
- `agent-id` - Agent ID or 'all'
- `target-accounts` - Comma-separated target account IDs

**Options:**
- `--dry-run` - Preview without executing
- `--skip-validation` - Skip pre-deployment validation
- `--no-retry` - Disable retry on error
- `--max-retries <n>` - Maximum retry attempts (default: 3)
- `--delay <ms>` - Delay between accounts in ms (default: 2000)
- `-v, --verbose` - Show detailed output

**Examples:**
```bash
bun elevenlabs-cli deploy compte1 agent_abc123 compte2,compte3
bun elevenlabs-cli deploy compte1 all compte2,compte3 --dry-run
bun elevenlabs-cli deploy compte1 agent_abc123 compte2 --max-retries 5 --delay 3000
```

### `sync <agent-id> [source-account]`

Sync agent updates from source to all other accounts.

**Options:**
- `--dry-run` - Preview without executing
- `-v, --verbose` - Show detailed output

**Examples:**
```bash
bun elevenlabs-cli sync agent_abc123 compte1
bun elevenlabs-cli sync agent_abc123  # Auto-detect source
```

### `status`

View account statistics and deployment history.

**Options:**
- `-a, --accounts` - Show account statistics
- `-d, --deployments [limit]` - Show deployment history (default: 10)
- `-v, --verbose` - Show detailed output

**Examples:**
```bash
bun elevenlabs-cli status
bun elevenlabs-cli status --accounts
bun elevenlabs-cli status --deployments 20 -v
```

## Workflow Examples

### Initial Setup

```bash
# 1. Pull all agents from all accounts
bun elevenlabs-cli pull all

# 2. View what was pulled
bun elevenlabs-cli status --accounts
```

### Deploy from Production to Dev/Staging

```bash
# 1. Pull latest from production
bun elevenlabs-cli pull compte1

# 2. Deploy to dev and staging
bun elevenlabs-cli deploy compte1 all compte2,compte3

# 3. View deployment history
bun elevenlabs-cli status --deployments
```

### Update Single Agent Across All Accounts

```bash
# 1. Pull latest version
bun elevenlabs-cli pull compte1

# 2. Sync to all other accounts
bun elevenlabs-cli sync agent_abc123 compte1

# 3. Verify deployment
bun elevenlabs-cli status --deployments 1 -v
```

## Development

```bash
# Install dependencies
bun install

# Build
bun run build

# Watch mode
bun run dev

# Type check
bun run check-types

# Lint
bun run lint
```
