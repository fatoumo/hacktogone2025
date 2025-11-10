"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  Download,
  Plus,
  MessageSquare,
  AlertCircle,
  Rocket,
  RefreshCw,
} from "lucide-react";
import type { AgentListItem } from "@repo/elevenlabs-agents";
import { AgentImportDialog } from "@/components/agents/AgentImportDialog";
import { AgentCard } from "@/components/agents/AgentCard";
import {
  AccountSelector,
  type Account,
} from "@/components/agents/AccountSelector";

export default function AgentsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null
  );
  const [agents, setAgents] = useState<AgentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [dataSource, setDataSource] = useState<"api" | "local" | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  // Load accounts on mount
  useEffect(() => {
    fetchAccounts();
  }, []);

  // Fetch agents when account changes
  useEffect(() => {
    if (selectedAccountId) {
      fetchAgents();
    }
  }, [selectedAccountId]);

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/accounts");
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);

        // Auto-select first configured account
        const firstConfigured = data.accounts.find(
          (acc: Account) => acc.configured && acc.enabled
        );
        if (firstConfigured) {
          setSelectedAccountId(firstConfigured.id);
        } else if (data.accounts.length > 0) {
          setSelectedAccountId(data.accounts[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
    }
  };

  const fetchAgents = async () => {
    if (!selectedAccountId) return;

    try {
      setLoading(true);
      setWarning(null);

      const response = await fetch(
        `/api/agents?account=${selectedAccountId}`
      );

      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents || []);
        setDataSource(data.source || "api");

        if (data.warning) {
          setWarning(data.warning);
        }
      } else {
        const error = await response.json();
        setWarning(
          error.error || "Failed to load agents from this account"
        );
        setAgents([]);
      }
    } catch (error) {
      console.error("Failed to fetch agents:", error);
      setWarning("Network error while loading agents");
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExportAll = async () => {
    if (!selectedAccountId) return;

    try {
      const response = await fetch(
        `/api/agents/export?account=${selectedAccountId}`
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `agents-${selectedAccountId}-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Failed to export agents:", error);
    }
  };

  const selectedAccount = accounts.find(
    (acc) => acc.id === selectedAccountId
  );

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">AI Agents</h1>
              <p className="text-muted-foreground mt-2">
                Manage and interact with your ElevenLabs conversational AI
                agents
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={() => setShowImportDialog(true)}
                disabled={!selectedAccountId}
              >
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
              <Button
                variant="outline"
                onClick={handleExportAll}
                disabled={!selectedAccountId || agents.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export All
              </Button>
              <Button
                onClick={() =>
                  window.open(
                    "https://elevenlabs.io/app/conversational-ai",
                    "_blank"
                  )
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Agent
              </Button>
            </div>
          </div>

          {/* Account Selector */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <AccountSelector
                accounts={accounts}
                selectedAccountId={selectedAccountId}
                onAccountChange={setSelectedAccountId}
              />
              {dataSource === "local" && (
                <Badge variant="outline" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Local Cache
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAgents}
                disabled={!selectedAccountId || loading}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>

          {/* Warning message */}
          {warning && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{warning}</AlertDescription>
            </Alert>
          )}

          {/* Account not configured warning */}
          {selectedAccount && !selectedAccount.configured && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                API key not configured for this account. Configure{" "}
                <code className="font-mono text-sm bg-muted px-1 py-0.5 rounded">
                  ELEVENLABS_{selectedAccount.id.toUpperCase()}_KEY
                </code>{" "}
                in your <code>.env.local</code> file or run{" "}
                <code className="font-mono text-sm bg-muted px-1 py-0.5 rounded">
                  bun agents:pull {selectedAccount.id}
                </code>{" "}
                to see cached agents.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Total Agents
              </CardTitle>
              <CardDescription>
                {selectedAccount?.name || "No account selected"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agents.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Account Tier
              </CardTitle>
              <CardDescription>
                {selectedAccount?.tier || "—"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">
                {selectedAccount?.max_concurrent || 0} concurrent
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Monthly Limit
              </CardTitle>
              <CardDescription>
                {selectedAccount?.tier || "—"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">
                {selectedAccount?.monthly_chars?.toLocaleString() || 0} chars
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agents List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Your Agents</h2>
            {agents.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  (window.location.href = `/agents/deploy?source=${selectedAccountId}`)
                }
              >
                <Rocket className="mr-2 h-4 w-4" />
                Deploy to Other Accounts
              </Button>
            )}
          </div>

          {!selectedAccountId ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  Please select an account to view agents
                </div>
              </CardContent>
            </Card>
          ) : loading ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  Loading agents...
                </div>
              </CardContent>
            </Card>
          ) : agents.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No agents found
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first agent on ElevenLabs or import existing
                    configurations
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button
                      onClick={() =>
                        window.open(
                          "https://elevenlabs.io/app/conversational-ai",
                          "_blank"
                        )
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Agent
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowImportDialog(true)}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Import
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {agents.map((agent) => (
                <AgentCard
                  key={agent.agent_id}
                  agent={agent}
                  accountId={selectedAccountId}
                  onRefresh={fetchAgents}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <AgentImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImportSuccess={fetchAgents}
      />
    </div>
  );
}
