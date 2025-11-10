# Hacktogone Toulouse 2025

A Turborepo monorepo for carbon footprint tracking and conversational AI agents integration. This project combines Next.js web applications with ElevenLabs voice agents, carbon data RAG (Retrieval-Augmented Generation) module, and Snowflake-based carbon scoring API.

**Package Manager**: Bun (v1.3.1)
**Build System**: Turborepo
**Framework**: Next.js 16 (App Router), React 19

## Quick Start

```bash
# Install dependencies
bun install

# Run all applications (Next.js + Python)
bun run dev

# Run specific application
bun run dev --filter=web                    # Web app (port 3000)
bun run dev --filter=carbon-data-rag        # RAG API (port 8000)
bun run dev --filter=scoring-api            # Scoring API (port 8501)
bun run dev --filter=eleven-agent-acceuil   # CLI agent
```

## What's inside?

This Turborepo includes the following applications and packages:

### Next.js Applications

- **`web`**: Main Next.js app with ElevenLabs agents integration, voice chat UI, and carbon scoring features
- **`admin`**: Admin Next.js app

### Python Applications

- **`carbon-data-rag`**: FastAPI-based RAG service with ChromaDB for semantic search over DEFRA 2024 emission factors
- **`scoring-api`**: Streamlit-based carbon footprint calculator for Snowflake deployment
- **`eleven_agent_acceuil`**: CLI agent for carbon footprint onboarding with ElevenLabs integration

### Shared Packages

- **`@repo/elevenlabs-agents`**: Shared ElevenLabs agent client & utilities (TypeScript)
- **`@repo/ui`**: React component library (shadcn/ui)
- **`@repo/eslint-config`**: ESLint configurations
- **`@repo/typescript-config`**: Shared TypeScript configurations

## Development

### Running All Applications

```bash
# Start all dev servers (Next.js + Python)
bun run dev
```

This will start:
- **Web app**: http://localhost:3000
- **Admin app**: http://localhost:3001
- **Carbon RAG API**: http://localhost:8000
- **Scoring API**: http://localhost:8501
- **Accueil Agent**: Interactive CLI

### Running Specific Applications

```bash
# Next.js applications
bun run dev --filter=web
bun run dev --filter=admin

# Python applications
bun run dev --filter=carbon-data-rag        # FastAPI
bun run dev --filter=scoring-api            # Streamlit
bun run dev --filter=eleven-agent-acceuil   # CLI

# Multiple specific apps
bun run dev --filter=web --filter=carbon-data-rag
```

### Building

```bash
# Build all apps
bun run build

# Build specific app
bun run build --filter=web
```

### Code Quality

```bash
# Lint all workspaces
bun run lint

# Type check all TypeScript workspaces
bun run check-types

# Format code
bun run format
```

## Python Applications Setup

### Prerequisites

Each Python application requires a virtual environment and dependencies installation:

```bash
# Carbon Data RAG
cd carbon-data-rag
python -m venv .venv
.venv\Scripts\activate  # Windows (.venv/bin/activate on Unix)
pip install -r requirements.txt
python src/ingest.py  # One-time data ingestion (~30 min)

# Scoring API
cd scoring-api
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt

# ElevenLabs Accueil Agent
cd eleven_agent_acceuil
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### Environment Variables

Create `.env` files in each Python module:

**carbon-data-rag/.env**:
```bash
# Optional: Add custom configuration
```

**scoring-api/.env**:
```bash
SNOWFLAKE_ACCOUNT=your_account
SNOWFLAKE_USER=your_user
SNOWFLAKE_PASSWORD=your_password
# ... (or use app_demo.py which requires no credentials)
```

**eleven_agent_acceuil/.env**:
```bash
ELEVENLABS_API_KEY=your_elevenlabs_key  # Optional
```

**apps/web/.env.local**:
```bash
ELEVENLABS_API_KEY=your_elevenlabs_key
HUGGINGFACE_API_KEY=your_hf_key  # Optional
HUGGINGFACE_WHISPER_ENDPOINT=your_endpoint  # Optional
```

### Remote Caching

> [!TIP]
> Vercel Remote Cache is free for all plans. Get started today at [vercel.com](https://vercel.com/signup?/signup?utm_source=remote-cache-sdk&utm_campaign=free_remote_cache).

Turborepo can use a technique known as [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup?utm_source=turborepo-examples), then enter the following commands:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo login

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo login
yarn exec turbo login
pnpm exec turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo link

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo link
yarn exec turbo link
pnpm exec turbo link
```

## Key Features

### 1. ElevenLabs Voice Agents Integration
- Dashboard for managing conversational AI agents ([apps/web/app/agents/](apps/web/app/agents/))
- Real-time voice chat interface using `@elevenlabs/react`
- Agent configuration import/export with Zod validation

### 2. Carbon Data RAG Module
- Semantic search over DEFRA 2024 emission factors using ChromaDB
- FastAPI REST API for natural language queries
- Vectorized database for intelligent carbon factor matching

### 3. Carbon Scoring API
- Streamlit-based calculator for energy, transport, and waste metrics
- Snowflake integration for data persistence
- Demo and production modes

### 4. CLI Onboarding Agent
- Interactive questionnaire for carbon footprint assessment
- Heuristic scoring across 4 categories
- ClickUp integration for CRM workflow automation

## Project Documentation

- **[CLAUDE.md](CLAUDE.md)**: Comprehensive development guide for Claude Code
- **[carbon-data-rag/README.md](carbon-data-rag/README.md)**: RAG module documentation
- **[eleven_agent_acceuil/clickup_integration.md](eleven_agent_acceuil/clickup_integration.md)**: ClickUp integration guide

## Technology Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS v4, shadcn/ui
- **Backend**: FastAPI, Streamlit, Next.js API Routes
- **AI/ML**: ElevenLabs API, OpenAI API, ChromaDB, sentence-transformers
- **Data**: Snowflake, DEFRA 2024 emission factors
- **Build**: Turborepo, Bun, TypeScript

## Useful Links

Learn more about the technologies used:

- [Turborepo Documentation](https://turborepo.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [ElevenLabs Conversational AI](https://elevenlabs.io/docs/conversational-ai)
- [ChromaDB Documentation](https://docs.trychroma.com)
- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [Streamlit Documentation](https://docs.streamlit.io)
