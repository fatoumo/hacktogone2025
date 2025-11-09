import { NextRequest, NextResponse } from "next/server";
import { AgentClient } from "@repo/elevenlabs-agents";

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "ElevenLabs API key not configured" },
        { status: 500 }
      );
    }

    const client = new AgentClient(apiKey);
    const agents = await client.listAgents();

    return NextResponse.json({ agents });
  } catch (error) {
    console.error("Failed to list agents:", error);
    return NextResponse.json(
      { error: "Failed to list agents" },
      { status: 500 }
    );
  }
}
