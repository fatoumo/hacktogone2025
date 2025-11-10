import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function GET() {
  try {
    // Read accounts from agents-data/accounts.json
    const dataDir = join(process.cwd(), "agents-data");
    const accountsPath = join(dataDir, "accounts.json");

    const content = await readFile(accountsPath, "utf-8");
    const data = JSON.parse(content);

    // Filter accounts and add configuration status
    const accounts = data.accounts.map((account: any) => {
      const apiKey = process.env[account.env_key];

      return {
        id: account.id,
        name: account.name,
        description: account.description,
        tier: account.tier,
        max_concurrent: account.max_concurrent,
        monthly_chars: account.monthly_chars,
        enabled: account.enabled,
        configured: !!apiKey, // Check if API key is configured
      };
    });

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("Failed to load accounts:", error);
    return NextResponse.json(
      { error: "Failed to load accounts configuration" },
      { status: 500 }
    );
  }
}
