"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import type { AgentConfig } from "@repo/elevenlabs-agents";
import { VoiceChat } from "@/components/agents/VoiceChat";

export default function AgentPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = use(params);
  const router = useRouter();
  const [agent, setAgent] = useState<AgentConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgent();
  }, [agentId]);

  const fetchAgent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/agents/${agentId}`);
      if (response.ok) {
        const data = await response.json();
        setAgent(data.agent);
      } else {
        console.error("Failed to fetch agent");
      }
    } catch (error) {
      console.error("Failed to fetch agent:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!agent) return;

    const blob = new Blob(
      [
        JSON.stringify(
          {
            version: "1.0",
            agents: [agent],
            exported_at: new Date().toISOString(),
          },
          null,
          2
        ),
      ],
      { type: "application/json" }
    );
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${agent.name.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="text-center">Loading agent...</div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Agent not found</h2>
          <Button onClick={() => router.push("/agents")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Agents
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push("/agents")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">{agent.name}</h1>
              {agent.description && (
                <p className="text-muted-foreground mt-2">{agent.description}</p>
              )}
            </div>
          </div>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>

        {/* Agent Details */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="font-medium">Agent ID</dt>
                  <dd className="text-muted-foreground">{agent.agent_id}</dd>
                </div>
                {agent.voice_id && (
                  <div>
                    <dt className="font-medium">Voice ID</dt>
                    <dd className="text-muted-foreground">{agent.voice_id}</dd>
                  </div>
                )}
                {agent.language && (
                  <div>
                    <dt className="font-medium">Language</dt>
                    <dd className="text-muted-foreground">{agent.language}</dd>
                  </div>
                )}
                {agent.prompt?.llm && (
                  <div>
                    <dt className="font-medium">Model</dt>
                    <dd className="text-muted-foreground">{agent.prompt.llm}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conversation Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                {agent.conversation_config?.turn_timeout && (
                  <div>
                    <dt className="font-medium">Turn Timeout</dt>
                    <dd className="text-muted-foreground">
                      {agent.conversation_config.turn_timeout}s
                    </dd>
                  </div>
                )}
                {agent.conversation_config?.max_duration && (
                  <div>
                    <dt className="font-medium">Max Duration</dt>
                    <dd className="text-muted-foreground">
                      {agent.conversation_config.max_duration}s
                    </dd>
                  </div>
                )}
                {agent.prompt?.temperature !== undefined && (
                  <div>
                    <dt className="font-medium">Temperature</dt>
                    <dd className="text-muted-foreground">{agent.prompt.temperature}</dd>
                  </div>
                )}
                {agent.prompt?.max_tokens && (
                  <div>
                    <dt className="font-medium">Max Tokens</dt>
                    <dd className="text-muted-foreground">{agent.prompt.max_tokens}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </div>

        {/* Voice Chat Interface */}
        <VoiceChat agentId={agent.agent_id} />
      </div>
    </div>
  );
}
