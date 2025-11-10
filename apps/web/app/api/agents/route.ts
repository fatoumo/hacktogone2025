import { NextRequest, NextResponse } from "next/server";
import { AgentClient } from "@repo/elevenlabs-agents";
import { FileStorage } from "@repo/elevenlabs-agents/server";

export async function GET(request: NextRequest) {
  try {
    // Get account ID from query parameter
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("account");

    if (!accountId) {
      return NextResponse.json(
        { error: "Account ID is required. Provide ?account=compte1" },
        { status: 400 }
      );
    }

    // Determine which API key to use based on account
    const envKeyMap: Record<string, string> = {
      compte1: "ELEVENLABS_ACCOUNT1_KEY",
      compte2: "ELEVENLABS_ACCOUNT2_KEY",
      compte3: "ELEVENLABS_ACCOUNT3_KEY",
    };

    const envKey = envKeyMap[accountId];
    if (!envKey) {
      return NextResponse.json(
        { error: `Invalid account ID: ${accountId}` },
        { status: 400 }
      );
    }

    const apiKey = process.env[envKey];

    if (!apiKey) {
      // Try to load from local storage as fallback
      try {
        const storage = new FileStorage();
        const localAgents = await storage.listAgents(accountId);

        return NextResponse.json({
          agents: localAgents.map((agent) => ({
            agent_id: agent.agent_id,
            name: agent.name,
          })),
          source: "local",
          warning: `No API key configured for ${accountId}. Showing local cached agents.`,
        });
      } catch (storageError) {
        return NextResponse.json(
          {
            error: `API key not configured for ${accountId} (${envKey}) and no local cache available`,
            accountId,
          },
          { status: 503 }
        );
      }
    }

    // Fetch from ElevenLabs API
    const client = new AgentClient(apiKey);
    const agents = await client.listAgents();

    return NextResponse.json({
      agents,
      source: "api",
      accountId,
    });
  } catch (error) {
    console.error("Failed to list agents:", error);
    return NextResponse.json(
      { error: "Failed to list agents", details: String(error) },
      { status: 500 }
    );
  }
}
