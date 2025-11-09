"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, CheckCircle, XCircle } from "lucide-react";
import { parseImportFile } from "@repo/elevenlabs-agents";

interface AgentImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess: () => void;
}

export function AgentImportDialog({
  open,
  onOpenChange,
  onImportSuccess,
}: AgentImportDialogProps) {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setResult(null);

    try {
      const agents = await parseImportFile(file);

      // Store the imported configurations in localStorage for now
      // In a real app, you might want to sync these with ElevenLabs API
      const existingImports = JSON.parse(localStorage.getItem("importedAgents") || "[]");
      const newImports = [...existingImports, ...agents];
      localStorage.setItem("importedAgents", JSON.stringify(newImports));

      setResult({
        success: true,
        message: `Successfully imported ${agents.length} agent(s)`,
      });

      setTimeout(() => {
        onImportSuccess();
        onOpenChange(false);
        setResult(null);
      }, 2000);
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Failed to import agents",
      });
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Agents</DialogTitle>
          <DialogDescription>
            Upload a JSON file containing agent configurations exported from ElevenLabs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">JSON files only</p>
              </div>
              <Input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".json"
                onChange={handleFileChange}
                disabled={importing}
              />
            </label>
          </div>

          {result && (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg ${
                result.success
                  ? "bg-green-50 text-green-900 dark:bg-green-900/20 dark:text-green-100"
                  : "bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-100"
              }`}
            >
              {result.success ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              <span className="text-sm">{result.message}</span>
            </div>
          )}

          {importing && (
            <div className="text-center text-sm text-muted-foreground">
              Importing agents...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
