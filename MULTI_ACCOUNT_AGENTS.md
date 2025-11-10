# Multi-Account ElevenLabs Agent Management System

Complete system for managing ElevenLabs agents across 3 accounts with CLI tools, web UI, and deployment automation.

## Overview

This system provides comprehensive tooling to:
- ✅ Manage agents across 3 ElevenLabs accounts (compte1, compte2, compte3)
- ✅ Bulk deploy agents from one account to multiple others
- ✅ Track deployment history with git-versioned configurations
- ✅ Web dashboard with multi-account support
- ✅ CLI tools for automation and CI/CD
- ✅ FastAPI service for carbon footprint questionnaire integration

## Architecture

```
hacktogone2025/
├── agents-data/                     # Git-versioned agent configurations
│   ├── accounts.json                # Account configurations
│   ├── deployments.json             # Deployment history
│   ├── voice-mappings.json          # Voice ID mappings between accounts
│   └── agents/
│       ├── compte1/                 # Agents from account 1
│       ├── compte2/                 # Agents from account 2
│       └── compte3/                 # Agents from account 3
│
├── packages/
│   ├── elevenlabs-agents/           # Enhanced SDK with multi-account support
│   │   └── src/
│   │       ├── account-manager.ts   # Manage multiple accounts
│   │       ├── deployment-service.ts # Bulk deployment & tracking
│   │       ├── resource-mapper.ts   # Voice/tool ID mapping
│   │       └── file-storage.ts      # Git-based storage
│   │
│   └── elevenlabs-cli/              # CLI tools
│       └── src/commands/
│           ├── pull.ts              # Import agents from API
│           ├── push.ts              # Deploy agents to API
│           ├── deploy.ts            # Bulk deployment
│           ├── sync.ts              # Sync updates
│           └── status.ts            # View status & history
│
├── apps/web/                        # Web UI with multi-account dashboard
│   ├── app/agents/                  # Multi-account agent dashboard
│   ├── app/api/
│   │   ├── accounts/                # Account management API
│   │   └── agents/                  # Agent operations with account param
│   └── components/agents/
│       └── AccountSelector.tsx      # Account switcher component
│
└── eleven_agent_acceuil/
    ├── api/main.py                  # FastAPI service (port 8002)
    └── main.py                      # Legacy CLI (still available)
```

## Setup

### 1. Environment Configuration

Create `.env.local` in the project root:

```bash
# ElevenLabs Multi-Account Configuration
ELEVENLABS_ACCOUNT1_KEY=sk_your_account1_key_here
ELEVENLABS_ACCOUNT2_KEY=sk_your_account2_key_here
ELEVENLABS_ACCOUNT3_KEY=sk_your_account3_key_here

# ElevenLabs Accueil Agent API
ELEVEN_ACCEUIL_API_URL=http://localhost:8002
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies
bun install

# Build packages
bun run build
```

### 3. Initial Configuration

Edit [agents-data/accounts.json](agents-data/accounts.json) to match your account tiers and limits:

```json
{
  "accounts": [
    {
      "id": "compte1",
      "name": "Compte 1 - Production",
      "tier": "Pro",
      "max_concurrent": 10,
      "monthly_chars": 500000,
      "env_key": "ELEVENLABS_ACCOUNT1_KEY"
    },
    ...
  ]
}
```

## Usage

### CLI Commands

#### Pull Agents from ElevenLabs API

```bash
# Pull from all accounts
bun agents:pull all

# Pull from specific account
bun agents:pull compte1

# Verbose output
bun agents:pull compte1 -v
```

This saves agents to `agents-data/agents/{account-id}/` as JSON files.

#### Deploy Agents Between Accounts

```bash
# Deploy single agent to multiple accounts
bun agents:deploy compte1 agent_abc123 compte2,compte3

# Deploy all agents from compte1 to autres comptes
bun agents:deploy compte1 all compte2,compte3

# Dry run (preview without executing)
bun agents:deploy compte1 agent_abc123 compte2,compte3 --dry-run

# Skip validation
bun agents:deploy compte1 agent_abc123 compte2,compte3 --skip-validation

# Custom retry settings
bun agents:deploy compte1 agent_abc123 compte2,compte3 --max-retries 5 --delay 3000
```

#### Sync Agent Updates Across Accounts

```bash
# Sync agent from source to all other accounts
bun agents:sync agent_abc123 compte1

# Auto-detect source account
bun agents:sync agent_abc123
```

#### View Status and History

```bash
# Show account status
bun agents:status --accounts

# Show deployment history (last 10)
bun agents:status --deployments

# Show last 20 deployments with verbose details
bun agents:status --deployments 20 -v
```

### Web Dashboard

Start the development server:

```bash
bun run dev
```

Navigate to http://localhost:3000/agents

**Features:**
- Account selector dropdown with tier badges
- Real-time agent listing from selected account
- Fallback to local cache if API key not configured
- Import/Export agents per account
- Deploy to other accounts button
- Account statistics (tier, concurrent limit, monthly chars)

### FastAPI Service (ElevenLabs Accueil Agent)

Start the FastAPI service for carbon footprint questionnaire:

```bash
cd eleven_agent_acceuil

# Activate virtual environment
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Unix/macOS

# Run API server
python api/main.py
```

API available at http://localhost:8002

**Endpoints:**
- `GET /api/v1/health` - Health check
- `GET /api/v1/questions` - Get questionnaire questions
- `POST /api/v1/questionnaire` - Submit answers and get scores
- `POST /api/v1/generate-summary` - Generate ElevenLabs summary

See [eleven_agent_acceuil/api/README.md](eleven_agent_acceuil/api/README.md) for full API documentation.

## Workflows

### Initial Setup Workflow

```bash
# 1. Configure API keys in .env.local
# 2. Pull all agents from all accounts
bun agents:pull all

# 3. Check status
bun agents:status --accounts

# 4. View in web dashboard
bun run dev
# Navigate to http://localhost:3000/agents
```

### Deploy from Production to Dev/Staging

```bash
# 1. Pull latest from production
bun agents:pull compte1

# 2. Deploy to dev and staging
bun agents:deploy compte1 all compte2,compte3

# 3. View deployment history
bun agents:status --deployments
```

### Update Single Agent Across All Accounts

```bash
# 1. Pull latest version
bun agents:pull compte1

# 2. Sync to all other accounts
bun agents:sync agent_abc123 compte1

# 3. Verify deployment
bun agents:status --deployments 1 -v
```

### Testing in Web UI

```bash
# 1. Start web server
bun run dev

# 2. Open http://localhost:3000/agents
# 3. Select account from dropdown
# 4. View agents for that account
# 5. Click "Deploy to Other Accounts" to bulk deploy
```

## Key Features

### 1. Multi-Account Support

- Manage 3 ElevenLabs accounts simultaneously
- Per-account API key configuration
- Account tier and limits displayed in UI
- Automatic account selection (first configured)

### 2. Git-Versioned Storage

All agent configurations stored in `agents-data/`:
- Track changes over time with Git
- Rollback to previous versions
- Collaborate with team members
- Audit deployment history

### 3. Resource Mapping

Automatically handles:
- **Voice ID mapping** between accounts (configurable in `voice-mappings.json`)
- **Fallback to default voice** if source voice doesn't exist in target
- **Tool ID validation** (warns if tools need manual verification)

### 4. Deployment Tracking

Full deployment history with:
- Source/target accounts
- Deployment timestamp
- Success/failure status per account
- Error details for debugging
- Partial deployment support (some succeed, some fail)

### 5. Fallback to Local Cache

If API key not configured:
- Automatically falls back to local cached agents
- Shows warning badge "Local Cache"
- Provides instructions to configure API key

### 6. Pre-flight Validation

Before deploying:
- Validates source/target accounts
- Checks voice ID availability
- Verifies tool dependencies
- Can be skipped with `--skip-validation`

### 7. Retry Logic

Automatic retry with exponential backoff:
- Configurable max retries (default: 3)
- Handles rate limits (429 errors)
- Delays between accounts to respect rate limits

## Troubleshooting

### API Key Issues

**Problem:** "API key not configured for compte1"

**Solution:**
```bash
# Check environment variables are set
echo $ELEVENLABS_ACCOUNT1_KEY

# Add to .env.local
ELEVENLABS_ACCOUNT1_KEY=sk_your_key_here
```

### Voice Not Found

**Problem:** "Voice {voice_id} not found in compte2"

**Solution:**
```bash
# Add mapping in agents-data/voice-mappings.json
{
  "mappings": {
    "source_voice_id_from_compte1": "target_voice_id_in_compte2"
  }
}
```

### Deployment Fails

**Problem:** Deployment fails with validation errors

**Solution:**
```bash
# Run with verbose to see details
bun agents:deploy compte1 agent_id compte2 -v

# Skip validation to force deploy
bun agents:deploy compte1 agent_id compte2 --skip-validation

# Check deployment history for errors
bun agents:status --deployments 5 -v
```

### No Agents in Local Cache

**Problem:** "No agents found in local cache"

**Solution:**
```bash
# Pull agents from API first
bun agents:pull compte1

# Then retry
```

## CI/CD Integration

Add to GitHub Actions workflow:

```yaml
name: Deploy Agents

on:
  push:
    branches: [main]
    paths:
      - 'agents-data/**'

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: 1.3.1

      - run: bun install
      - run: bun run build

      - name: Deploy to all accounts
        env:
          ELEVENLABS_ACCOUNT1_KEY: ${{ secrets.ELEVENLABS_ACCOUNT1_KEY }}
          ELEVENLABS_ACCOUNT2_KEY: ${{ secrets.ELEVENLABS_ACCOUNT2_KEY }}
          ELEVENLABS_ACCOUNT3_KEY: ${{ secrets.ELEVENLABS_ACCOUNT3_KEY }}
        run: |
          bun agents:deploy compte1 all compte2,compte3
```

## API Documentation

### Account Management API

**GET /api/accounts**

Returns list of configured accounts:

```json
{
  "accounts": [
    {
      "id": "compte1",
      "name": "Compte 1 - Production",
      "tier": "Pro",
      "max_concurrent": 10,
      "monthly_chars": 500000,
      "enabled": true,
      "configured": true
    }
  ]
}
```

### Agent Operations API

**GET /api/agents?account=compte1**

List agents for specific account:

```json
{
  "agents": [
    {
      "agent_id": "agent_abc123",
      "name": "Support Bot"
    }
  ],
  "source": "api",
  "accountId": "compte1"
}
```

**GET /api/agents/[agentId]?account=compte1**

Get specific agent details for account:

```json
{
  "agent": {
    "agent_id": "agent_abc123",
    "name": "Support Bot",
    "conversation_config": {...}
  },
  "source": "api",
  "accountId": "compte1"
}
```

## Development

### Project Structure

- **`packages/elevenlabs-agents`** - Enhanced SDK with multi-account capabilities
- **`packages/elevenlabs-cli`** - CLI tool for bulk operations
- **`apps/web`** - Next.js web dashboard
- **`eleven_agent_acceuil/api`** - FastAPI service for carbon scoring
- **`agents-data/`** - Git-versioned agent configurations

### Adding a New Account

1. Add to `agents-data/accounts.json`:
   ```json
   {
     "id": "compte4",
     "name": "Compte 4 - Testing",
     "tier": "Starter",
     "max_concurrent": 3,
     "monthly_chars": 30000,
     "enabled": true,
     "env_key": "ELEVENLABS_ACCOUNT4_KEY"
   }
   ```

2. Add API key to `.env.local`:
   ```bash
   ELEVENLABS_ACCOUNT4_KEY=sk_your_key_here
   ```

3. Update API routes in `apps/web/app/api/agents/route.ts`:
   ```typescript
   const envKeyMap: Record<string, string> = {
     compte1: "ELEVENLABS_ACCOUNT1_KEY",
     compte2: "ELEVENLABS_ACCOUNT2_KEY",
     compte3: "ELEVENLABS_ACCOUNT3_KEY",
     compte4: "ELEVENLABS_ACCOUNT4_KEY", // Add this
   };
   ```

4. Create agents directory:
   ```bash
   mkdir agents-data/agents/compte4
   ```

## Resources

- [ElevenLabs API Documentation](https://elevenlabs.io/docs/api-reference)
- [ElevenLabs Conversational AI](https://elevenlabs.io/app/conversational-ai)
- [CLI Tool README](packages/elevenlabs-cli/README.md)
- [FastAPI Service README](eleven_agent_acceuil/api/README.md)
- [Project CLAUDE.md](CLAUDE.md)

## License

Private project for Hacktogone Toulouse 2025.
