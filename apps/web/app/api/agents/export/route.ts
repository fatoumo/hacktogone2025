import { NextRequest, NextResponse } from "next/server";
import { AgentClient, exportAgents } from "@repo/elevenlabs-agents";

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
    const agentsList = await client.listAgents();

    // Fetch full details for each agent
    const agentsWithDetails = await Promise.all(
      agentsList.map((agent) => client.getAgent(agent.agent_id))
    );

    const exportJson = exportAgents(agentsWithDetails);

    return new NextResponse(exportJson, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="agents-export-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    console.error("Failed to export agents:", error);
    return NextResponse.json(
      { error: "Failed to export agents" },
      { status: 500 }
    );
  }
}
