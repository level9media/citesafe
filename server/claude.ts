import Anthropic from "@anthropic-ai/sdk";
import { ENV } from "./_core/env";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    if (!ENV.anthropicApiKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }
    _client = new Anthropic({ apiKey: ENV.anthropicApiKey });
  }
  return _client;
}

export type ClaudeMessage = {
  role: "user" | "assistant";
  content:
    | string
    | Array<
        | { type: "text"; text: string }
        | {
            type: "image";
            source: {
              type: "base64";
              media_type: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
              data: string;
            };
          }
      >;
};

/**
 * Calls Claude with optional vision support.
 * Returns the text content of the first response block.
 */
export async function invokeClaudeVision({
  systemPrompt,
  messages,
  maxTokens = 1200,
}: {
  systemPrompt: string;
  messages: ClaudeMessage[];
  maxTokens?: number;
}): Promise<string> {
  const client = getClient();

  const response = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: messages as Anthropic.MessageParam[],
  });

  const textBlock = response.content.find(b => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text content");
  }

  return textBlock.text;
}

/**
 * Validates the Anthropic API key with a minimal request.
 */
export async function validateAnthropicKey(): Promise<boolean> {
  try {
    const client = getClient();
    await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 5,
      messages: [{ role: "user", content: "ping" }],
    });
    return true;
  } catch {
    return false;
  }
}
