"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Download, ExternalLink } from "lucide-react";
import type { AgentListItem } from "@repo/elevenlabs-agents";
import Link from "next/link";

interface AgentCardProps {
  agent: AgentListItem;
  onRefresh: () => void;
}

export function AgentCard({ agent, onRefresh }: AgentCardProps) {
  const handleExport = async () => {
    try {
      const response = await fetch(`/api/agents/${agent.agent_id}`);
      if (response.ok) {
        const { agent: agentData } = await response.json();
        const blob = new Blob(
          [JSON.stringify({ version: "1.0", agents: [agentData], exported_at: new Date().toISOString() }, null, 2)],
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
      }
    } catch (error) {
      console.error("Failed to export agent:", error);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="truncate">{agent.name}</span>
          <MessageSquare className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </CardTitle>
        <CardDescription>
          {agent.created_at
            ? `Created ${new Date(agent.created_at).toLocaleDateString()}`
            : "Agent ID: " + agent.agent_id.substring(0, 8)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <Link href={`/agents/${agent.agent_id}`} className="w-full">
            <Button className="w-full" variant="default">
              <MessageSquare className="mr-2 h-4 w-4" />
              Chat
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button className="flex-1" variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                window.open(`https://elevenlabs.io/app/conversational-ai/${agent.agent_id}`, "_blank")
              }
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
