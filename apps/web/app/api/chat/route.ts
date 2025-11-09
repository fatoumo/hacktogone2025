import { OpenAI } from "openai";
import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

// Create OpenRouter provider using AI SDK
const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || "",
  baseURL: "https://openrouter.ai/api/v1",
  headers: {
    "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
    "X-Title": "Hacktogone 2025 Chat",
  },
});

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Use a free model from OpenRouter
    // google/gemini-2.0-flash-exp:free is a good free option
    const result = streamText({
      model: openrouter("google/gemini-2.0-flash-exp:free"),
      messages,
      temperature: 0.7,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process chat request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
