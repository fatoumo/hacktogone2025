import type { AgentConfig, AgentExport } from "./types";
import { AgentExportSchema, AgentConfigSchema } from "./types";
import { AgentError } from "./types";

/**
 * Export agents to JSON format
 */
export function exportAgents(agents: AgentConfig[]): string {
  const exportData: AgentExport = {
    version: "1.0",
    agents,
    exported_at: new Date().toISOString(),
  };

  try {
    AgentExportSchema.parse(exportData);
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    throw new AgentError(
      "Failed to export agents",
      "EXPORT_VALIDATION_FAILED",
      error
    );
  }
}

/**
 * Import agents from JSON format
 */
export function importAgents(jsonData: string): AgentConfig[] {
  try {
    const parsed = JSON.parse(jsonData);
    const validated = AgentExportSchema.parse(parsed);
    return validated.agents;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new AgentError("Invalid JSON format", "IMPORT_INVALID_JSON", error);
    }
    throw new AgentError(
      "Failed to import agents",
      "IMPORT_VALIDATION_FAILED",
      error
    );
  }
}

/**
 * Validate a single agent configuration
 */
export function validateAgentConfig(config: unknown): AgentConfig {
  try {
    return AgentConfigSchema.parse(config);
  } catch (error) {
    throw new AgentError(
      "Invalid agent configuration",
      "VALIDATION_FAILED",
      error
    );
  }
}

/**
 * Export a single agent to JSON
 */
export function exportAgent(agent: AgentConfig): string {
  return exportAgents([agent]);
}

/**
 * Create a downloadable blob for agent export
 */
export function createExportBlob(agents: AgentConfig[]): Blob {
  const jsonString = exportAgents(agents);
  return new Blob([jsonString], { type: "application/json" });
}

/**
 * Parse imported file content
 */
export async function parseImportFile(file: File): Promise<AgentConfig[]> {
  try {
    const text = await file.text();
    return importAgents(text);
  } catch (error) {
    throw new AgentError(
      "Failed to parse import file",
      "FILE_PARSE_FAILED",
      error
    );
  }
}
