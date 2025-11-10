# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hacktogone Toulouse 2025 project: A Turborepo monorepo for carbon footprint tracking and conversational AI agents integration. The project combines Next.js web applications with ElevenLabs voice agents, carbon data RAG (Retrieval-Augmented Generation) module, and Snowflake-based carbon scoring API.

**Package Manager**: Bun (v1.3.1)
**Build System**: Turborepo
**Framework**: Next.js 16 (App Router), React 19

## Development Commands

### Root-level commands

```bash
# Development (all apps)
bun run dev

# Development (specific app)
bun run dev --filter=web     # Port 3000
bun run dev --filter=admin   # Port 3001

# Build all apps/packages
bun run build

# Build specific app
bun run build --filter=web

# Linting
bun run lint

# Type checking
bun run check-types

# Format code
bun run format
```

### App-specific commands

```bash
# Web app (apps/web)
cd apps/web
bun run dev              # Start dev server on port 3000
bun run build            # Production build
bun run check-types      # Type check with Next.js typegen

# Admin app (apps/admin)
cd apps/admin
bun run dev              # Start dev server on port 3001
```

### Carbon Data RAG module (Python)

```bash
cd carbon-data-rag

# Setup virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Ingest DEFRA data into ChromaDB (run once, ~30 min)
python src/ingest.py

# Start FastAPI server
fastapi dev src/api.py     # API on http://localhost:8000

# Test RAG client
python examples/agent_client.py

# Validate setup
python validate.py
```

### Scoring API (Python/Streamlit)

```bash
cd scoring-api

# Install dependencies
pip install -r requirements.txt

# Run demo version (no database required)
streamlit run app_demo.py

# Run full version (requires Snowflake)
streamlit run app.py
```

## Architecture

### Monorepo Structure

```
apps/
├── web/              # Main Next.js app with ElevenLabs agents integration
│   ├── app/
│   │   ├── agents/           # ElevenLabs agents dashboard & chat UI
│   │   ├── carbon-scoring/   # Carbon scoring feature
│   │   └── api/              # Next.js API routes
│   └── components/
│       ├── ui/               # shadcn/ui components (Button, Card, Dialog, Input)
│       └── agents/           # Agent-specific components (VoiceChat, AgentCard)
│
└── admin/            # Admin Next.js app

packages/
├── elevenlabs-agents/    # Shared ElevenLabs agent client & utilities
│   └── src/
│       ├── client.ts          # AgentClient class for API operations
│       ├── import-export.ts   # Agent config import/export utilities
│       └── types.ts           # TypeScript types & Zod schemas
│
├── ui/                   # Shared React component library
├── eslint-config/        # Shared ESLint configurations
└── typescript-config/    # Shared TypeScript configurations

carbon-data-rag/      # Python RAG module (standalone)
├── src/
│   ├── ingest.py         # DEFRA data → ChromaDB vectorization
│   ├── rag_service.py    # RAG service with semantic search
│   └── api.py            # FastAPI REST API
└── data/
    ├── defra_2024.xlsx       # DEFRA 2024 emission factors
    └── chroma_db/            # Persistent vector database

scoring-api/          # Python Streamlit app (Snowflake deployment)
├── app.py                # Main Streamlit application
├── api/scoring.py        # Carbon scoring logic
└── config/               # Snowflake & app configuration
```

### Technology Stack

**Frontend (apps/web)**:
- Next.js 16 (App Router)
- React 19
- Tailwind CSS v4 with shadcn/ui components
- Vercel AI SDK (`ai`, `@ai-sdk/elevenlabs`, `@ai-sdk/openai`)
- ElevenLabs React SDK (`@elevenlabs/react`) for voice chat
- Framer Motion for animations
- Zod for validation

**Backend**:
- Next.js API routes
- FastAPI (carbon-data-rag module)
- Streamlit (scoring-api)

**Data & AI**:
- ChromaDB (vector database for RAG)
- sentence-transformers (embeddings)
- Snowflake (data warehouse for scoring API)
- OpenAI API
- ElevenLabs Conversational AI API

## Key Features

### 1. ElevenLabs Agents Integration

**Location**: `apps/web/app/agents/`

- Dashboard showing all ElevenLabs conversational AI agents
- Individual agent chat pages with voice interface
- Import/Export agent configurations (JSON with Zod validation)
- Real-time voice chat using `@elevenlabs/react` hooks

**API Routes**:
- `GET /api/agents` - List all agents
- `GET /api/agents/[agentId]` - Get specific agent
- `GET /api/agents/export` - Export all agents as JSON

**Environment Variables** (apps/web/.env.local):
```bash
ELEVENLABS_API_KEY=      # Required for ElevenLabs API
HUGGINGFACE_API_KEY=     # Optional for Whisper integration
HUGGINGFACE_WHISPER_ENDPOINT=  # Optional Whisper endpoint
```

### 2. Carbon Data RAG Module

**Location**: `carbon-data-rag/`

Provides semantic search over DEFRA 2024 emission factors using ChromaDB vector database.

**Why RAG over SQL**:
- Semantic search: "electric car France" finds relevant factors without exact match
- Natural language queries for agents
- Easy to extend with multiple data sources (ADEME, EPA)
- Returns context-enriched results with metadata

**Key Endpoints** (http://localhost:8000):
- `GET /` - Health check
- `GET /stats` - Database statistics
- `GET /categories` - Available emission categories
- `POST /query` - Semantic search for emission factors
- `POST /calculate` - Calculate emissions for activity + value

**Setup Requirements**:
1. Download DEFRA 2024 data to `data/defra_2024.xlsx`
2. Run `python src/ingest.py` once to vectorize data (~30 min)
3. Start API with `fastapi dev src/api.py`

### 3. Carbon Scoring API

**Location**: `scoring-api/`

Streamlit-based carbon footprint calculator designed for Snowflake deployment.

**Features**:
- Calculate carbon scores from energy, transport, and waste metrics
- Snowflake integration for data persistence
- Configurable scoring weights and emission factors
- Historical data tracking

**Deployment**:
- Can run locally or deploy to Snowflake Streamlit
- Demo version (`app_demo.py`) requires no database
- Full version (`app.py`) requires Snowflake credentials

## Important Patterns

### Working with Turborepo

- Use `--filter=<workspace>` to target specific apps/packages
- Turborepo handles dependency graph automatically
- Build outputs are cached in `.turbo/`

### Shared Packages

Packages in `packages/` are imported using workspace protocol:
```typescript
// In apps/web/package.json
{
  "dependencies": {
    "@repo/elevenlabs-agents": "*",
    "@repo/ui": "*"
  }
}
```

Import in code:
```typescript
import { AgentClient } from "@repo/elevenlabs-agents";
```

### shadcn/ui Components

Located in `apps/web/components/ui/`. Configuration in `apps/web/components.json`.

To add new components:
```bash
cd apps/web
npx shadcn@latest add <component-name>
```

### Tailwind CSS v4

Uses PostCSS configuration (`postcss.config.mjs`) with `@tailwindcss/postcss`.
Global styles in `apps/web/app/globals.css` with CSS variables for theming.

### Python Virtual Environments

Both Python modules use virtual environments:
```bash
# Create once
python -m venv .venv

# Activate (run each time)
source .venv/bin/activate  # Unix
.venv\Scripts\activate     # Windows
```

## Testing

### Type Checking

```bash
# All workspaces
bun run check-types

# Specific workspace
bun run check-types --filter=web
```

### Linting

```bash
# All workspaces
bun run lint

# Specific workspace
bun run lint --filter=web
```

## Common Workflows

### Adding a new dependency to web app

```bash
cd apps/web
bun add <package-name>
```

### Creating a new shared package

1. Create directory in `packages/<package-name>`
2. Add `package.json` with name `@repo/<package-name>`
3. Add to workspace consumers' dependencies
4. Run `bun install` at root

### Working with ElevenLabs agents

1. Create agents at https://elevenlabs.io/app/conversational-ai
2. Set `ELEVENLABS_API_KEY` in `apps/web/.env.local`
3. Agents appear automatically in `/agents` dashboard
4. Use `@elevenlabs/react` hooks for voice conversations

### Extending Carbon RAG

1. Add new data sources to `carbon-data-rag/data/`
2. Update `src/ingest.py` to parse new formats
3. Re-run ingestion: `python src/ingest.py`
4. API automatically serves updated data

## Troubleshooting

### Bun installation issues

Ensure Bun v1.3.1 is installed: `bun --version`

### ChromaDB not found

Re-run ingestion: `cd carbon-data-rag && python src/ingest.py`

### Snowflake connection issues

Check credentials in `scoring-api/.env` or Snowflake app secrets.

### Port conflicts

- Web app: port 3000
- Admin app: port 3001
- Carbon RAG API: port 8000
- Streamlit: default port 8501

## Git Workflow

Repository uses conventional commits. Recent commits show patterns:
- `Add` for new features
- `Update` for enhancements
- `Fix` for bug fixes
- `Redesign` for UI/UX changes

Current branch: `master`
