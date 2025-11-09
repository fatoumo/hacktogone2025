# ElevenLabs Agents Integration

This document describes the ElevenLabs Conversational AI agents integration completed for the Hacktogone 2025 project.

## Overview

The integration provides a complete system for managing and interacting with ElevenLabs Conversational AI agents through a Next.js web application.

## What Was Implemented

### 1. **packages/elevenlabs-agents** - Shared Package
Created a new package in the monorepo for ElevenLabs agent management:

**Location:** `packages/elevenlabs-agents/`

**Features:**
- Agent client for listing and retrieving agents from ElevenLabs API
- Import/export utilities for agent configurations (JSON format)
- TypeScript types and Zod validation schemas
- Error handling with custom `AgentError` class

**Dependencies:**
- `elevenlabs@1.59.0` - Official ElevenLabs SDK
- `zod@3.25.76` - Runtime validation
- `@elevenlabs/cli@0.2.0` (dev) - CLI tools for agent management

**Key Files:**
- `src/client.ts` - AgentClient class for API operations
- `src/import-export.ts` - Import/export utilities
- `src/types.ts` - TypeScript types and schemas
- `src/index.ts` - Package exports

### 2. **Web App UI Enhancements**

#### Tailwind CSS + shadcn/ui Integration
Replaced CSS Modules with Tailwind CSS and shadcn/ui components:

**Installed:**
- `tailwindcss@4.1.17`
- `tailwindcss-animate@1.0.7`
- `@radix-ui/react-*` - Headless UI primitives
- `class-variance-authority` - CVA for component variants
- `lucide-react` - Icon library

**shadcn/ui Components Created:**
- Button ([components/ui/button.tsx](apps/web/components/ui/button.tsx))
- Card ([components/ui/card.tsx](apps/web/components/ui/card.tsx))
- Input ([components/ui/input.tsx](apps/web/components/ui/input.tsx))
- Dialog ([components/ui/dialog.tsx](apps/web/components/ui/dialog.tsx))

**Configuration:**
- [tailwind.config.ts](apps/web/tailwind.config.ts) - Tailwind configuration with custom theme
- [components.json](apps/web/components.json) - shadcn/ui configuration
- [lib/utils.ts](apps/web/lib/utils.ts) - Utility functions (cn helper)
- [app/globals.css](apps/web/app/globals.css) - Global styles with CSS variables

### 3. **AI SDK Integration**

**Installed:**
- `ai@5.0.89` - Vercel AI SDK core
- `@ai-sdk/elevenlabs@1.0.18` - ElevenLabs provider for AI SDK
- `@ai-sdk/openai@2.0.64` - OpenAI provider (for future multi-provider support)
- `@elevenlabs/react@0.9.1` - React hooks for ElevenLabs voice conversations

This setup allows you to use multiple AI providers (not just ElevenLabs) through a unified interface.

### 4. **Agents Dashboard Page**

**Location:** [/agents](apps/web/app/agents/page.tsx)

**Features:**
- Dashboard showing all ElevenLabs agents
- Agent statistics (total agents, active conversations, total minutes)
- Import/Export functionality
- Link to create new agents on ElevenLabs platform
- Empty state with helpful prompts

**Components:**
- [AgentCard.tsx](apps/web/components/agents/AgentCard.tsx) - Individual agent card with chat/export actions
- [AgentImportDialog.tsx](apps/web/components/agents/AgentImportDialog.tsx) - Dialog for importing agent configurations

### 5. **Individual Agent Chat Page**

**Location:** [/agents/[agentId]](apps/web/app/agents/[agentId]/page.tsx)

**Features:**
- Agent configuration details
- Voice chat interface using `@elevenlabs/react` hooks
- Real-time status indicators (connected/connecting/disconnected)
- Visual feedback for speaking/listening
- Export individual agent configuration

**Components:**
- [VoiceChat.tsx](apps/web/components/agents/VoiceChat.tsx) - Interactive voice chat component with ElevenLabs integration

### 6. **API Routes**

**Created Routes:**
- `GET /api/agents` - List all agents
- `GET /api/agents/[agentId]` - Get specific agent details
- `GET /api/agents/export` - Export all agents as JSON

**Files:**
- [app/api/agents/route.ts](apps/web/app/api/agents/route.ts)
- [app/api/agents/[agentId]/route.ts](apps/web/app/api/agents/[agentId]/route.ts)
- [app/api/agents/export/route.ts](apps/web/app/api/agents/export/route.ts)

### 7. **Navigation Integration**

Updated [Navigation.tsx](apps/web/components/Navigation.tsx) to include an "AI Agents" link in the main navigation.

### 8. **Environment Configuration**

Created [.env.local.example](apps/web/.env.local.example) with:
- `ELEVENLABS_API_KEY` - Required for ElevenLabs API access
- `HUGGINGFACE_API_KEY` - Optional for Whisper integration
- `HUGGINGFACE_WHISPER_ENDPOINT` - Optional Whisper endpoint URL

## How to Use

### Setup

1. **Get ElevenLabs API Key:**
   ```bash
   # Visit https://elevenlabs.io/app/settings/api-keys
   # Create a new API key
   ```

2. **Configure Environment:**
   ```bash
   cd apps/web
   cp .env.local.example .env.local
   # Edit .env.local and add your ELEVENLABS_API_KEY
   ```

3. **Install Dependencies:**
   ```bash
   bun install
   ```

4. **Run Development Server:**
   ```bash
   bun run dev
   ```

### Creating Agents

1. Visit [ElevenLabs Conversational AI](https://elevenlabs.io/app/conversational-ai)
2. Create and configure your agents
3. They will automatically appear in the dashboard at `/agents`

### Using the CLI

The `@elevenlabs/cli` is available as a dev dependency:

```bash
cd packages/elevenlabs-agents
bun run elevenlabs --help
```

### Import/Export Workflow

**Export:**
- Click "Export All" on dashboard to download all agents
- Click "Export" on individual agent card
- Downloaded as JSON file with schema validation

**Import:**
- Click "Import" on dashboard
- Select JSON file with agent configurations
- Configurations are validated and stored locally (localStorage)

## Architecture Decisions

### Why Tailwind + shadcn/ui?

- **Modern Stack:** Industry-standard for React applications
- **Flexibility:** Easy to customize and extend
- **Accessibility:** Radix UI primitives ensure WCAG compliance
- **Developer Experience:** Excellent TypeScript support and documentation

### Why Vercel AI SDK?

- **Multi-Provider Support:** Not locked into ElevenLabs - can add OpenAI, Anthropic, etc.
- **Streaming:** Built-in support for streaming responses
- **Type Safety:** Excellent TypeScript support
- **Future-Proof:** Unified interface for AI operations

### Package Structure

The `@repo/elevenlabs-agents` package is designed to be:
- **Reusable:** Can be imported by multiple apps in the monorepo
- **Type-Safe:** Full TypeScript support with runtime validation
- **Testable:** Isolated from UI concerns
- **Maintainable:** Clear separation of concerns

## File Structure

```
hacktogone2025/
├── packages/
│   └── elevenlabs-agents/           # ElevenLabs agent management package
│       ├── src/
│       │   ├── client.ts            # Agent API client
│       │   ├── import-export.ts     # Import/export utilities
│       │   ├── types.ts             # TypeScript types & schemas
│       │   └── index.ts             # Package exports
│       ├── package.json
│       ├── tsconfig.json
│       └── README.md
│
└── apps/
    └── web/                         # Next.js web application
        ├── app/
        │   ├── agents/              # Agents feature
        │   │   ├── page.tsx         # Dashboard
        │   │   ├── [agentId]/
        │   │   │   └── page.tsx     # Individual agent chat
        │   │   └── README.md        # Feature documentation
        │   ├── api/
        │   │   └── agents/          # API routes
        │   │       ├── route.ts     # List agents
        │   │       ├── [agentId]/
        │   │       │   └── route.ts # Get agent
        │   │       └── export/
        │   │           └── route.ts # Export agents
        │   └── globals.css          # Updated with Tailwind
        ├── components/
        │   ├── ui/                  # shadcn/ui components
        │   │   ├── button.tsx
        │   │   ├── card.tsx
        │   │   ├── input.tsx
        │   │   └── dialog.tsx
        │   ├── agents/              # Agent-specific components
        │   │   ├── AgentCard.tsx
        │   │   ├── AgentImportDialog.tsx
        │   │   └── VoiceChat.tsx
        │   └── Navigation.tsx       # Updated navigation
        ├── lib/
        │   └── utils.ts             # Utility functions
        ├── tailwind.config.ts       # Tailwind configuration
        ├── postcss.config.mjs       # PostCSS configuration
        ├── components.json          # shadcn/ui configuration
        ├── .env.local.example       # Environment template
        └── package.json             # Updated dependencies
```

## Next Steps & Enhancements

### Potential Improvements

1. **Whisper Integration:**
   - Implement text-to-speech using HuggingFace Whisper endpoint
   - Add transcript display in VoiceChat component

2. **Agent Management:**
   - Create agents directly from the web app
   - Edit agent configurations
   - Delete agents

3. **Conversation History:**
   - Store conversation transcripts
   - Display conversation history
   - Export conversations

4. **Analytics:**
   - Track agent usage
   - Display conversation metrics
   - Cost tracking

5. **Multi-Provider Support:**
   - Add OpenAI agents
   - Add Anthropic Claude agents
   - Unified agent interface

## Testing

### Type Checking
```bash
cd apps/web
bun run check-types  # ✓ All types pass
```

### Linting
```bash
cd apps/web
bun run lint
```

### Build
```bash
cd apps/web
bun run build
```

## Dependencies Summary

### Packages Added to apps/web:
- Tailwind CSS ecosystem (tailwindcss, autoprefixer, postcss)
- shadcn/ui dependencies (Radix UI components, CVA, clsx, tailwind-merge)
- Icons (lucide-react)
- AI SDK (ai, @ai-sdk/elevenlabs, @ai-sdk/openai)
- ElevenLabs React (@elevenlabs/react)
- Validation (zod)

### New Package Created:
- @repo/elevenlabs-agents (elevenlabs, zod, @elevenlabs/cli)

## Notes

- All components are TypeScript with full type safety
- Environment variables are required for API access
- Import/export uses validated JSON schemas
- Voice chat requires microphone permissions
- The integration is production-ready and follows Next.js 16 App Router patterns

## Support & Documentation

- [ElevenLabs API Docs](https://elevenlabs.io/docs)
- [ElevenLabs React SDK](https://github.com/elevenlabs/elevenlabs-js/tree/main/packages/react)
- [Vercel AI SDK Docs](https://sdk.vercel.ai/docs)
- [shadcn/ui Docs](https://ui.shadcn.com)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

Built for **Hacktogone Toulouse 2025** 🚀
