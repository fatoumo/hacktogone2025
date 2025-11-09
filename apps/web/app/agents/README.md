# AI Agents

This section of the web app manages ElevenLabs Conversational AI agents.

## Features

- **Agent Dashboard**: View all your ElevenLabs agents in one place
- **Agent Import/Export**: Import and export agent configurations as JSON files
- **Voice Chat**: Interactive voice conversations with AI agents
- **Agent Details**: View configuration and settings for each agent

## Setup

1. **Get an ElevenLabs API Key**:
   - Sign up at [ElevenLabs](https://elevenlabs.io)
   - Navigate to Settings > API Keys
   - Create a new API key

2. **Configure Environment Variables**:
   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` and add your API key:
   ```
   ELEVENLABS_API_KEY=your_api_key_here
   ```

3. **Create Agents**:
   - Visit [ElevenLabs Conversational AI](https://elevenlabs.io/app/conversational-ai)
   - Create and configure your agents
   - They will automatically appear in the dashboard

## Usage

### Viewing Agents
Navigate to `/agents` to see all your configured agents.

### Chatting with an Agent
1. Click on an agent card
2. Click "Start Call" to begin a voice conversation
3. Speak naturally with the agent
4. Click "End Call" to terminate

### Importing Agents
1. Click "Import" on the agents dashboard
2. Select a JSON file with agent configurations
3. The agents will be imported and stored locally

### Exporting Agents
- **Export All**: Click "Export All" on the dashboard to download all agents
- **Export Single**: Click "Export" on an individual agent card

## File Structure

```
app/agents/
├── page.tsx                    # Main agents dashboard
├── [agentId]/
│   └── page.tsx                # Individual agent chat page
└── README.md                   # This file

components/agents/
├── AgentCard.tsx               # Agent card component
├── AgentImportDialog.tsx       # Import dialog component
└── VoiceChat.tsx               # Voice chat interface

app/api/agents/
├── route.ts                    # List all agents
├── [agentId]/route.ts          # Get single agent
└── export/route.ts             # Export agents
```

## Integration with @elevenlabs/react

The voice chat feature uses the `@elevenlabs/react` library's `Conversation` component for seamless voice interaction with agents.

## CLI Management

The `@elevenlabs/cli` is installed as a dev dependency in the `@repo/elevenlabs-agents` package:

```bash
cd packages/elevenlabs-agents
bun run elevenlabs --help
```

## Notes

- Agent configurations are fetched from ElevenLabs API in real-time
- Imported agents are stored in localStorage for reference
- Text-to-speech uses Whisper large model via HuggingFace (optional)
