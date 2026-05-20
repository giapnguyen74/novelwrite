import type { AiClientConfig, ChatCompletionRequest } from "./ai-types";
import { mapAiHttpError, normalizeAiError } from "./ai-errors";

export async function completeChat(
  config: AiClientConfig,
  request: ChatCompletionRequest
): Promise<string> {
  const baseUrl = config.baseUrl.replace(/\/$/, "");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(config.headers ?? {}),
  };

  if (config.apiKey?.trim()) {
    headers.Authorization = `Bearer ${config.apiKey.trim()}`;
  }

  let response: Response;

  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify(request),
    });
  } catch (error) {
    throw normalizeAiError(error);
  }

  if (!response.ok) {
    const body = await safeReadText(response);
    throw mapAiHttpError(response.status, body);
  }

  let json: any;
  try {
    json = await response.json();
  } catch (error) {
    throw new Error("Invalid JSON response from the AI proxy.");
  }

  const message = json?.choices?.[0]?.message;
  let content = message?.content;

  // Fallback to reasoning or reasoning_content for thinking models that return blank content
  if (content === undefined || content === null || (typeof content === "string" && !content.trim())) {
    const fallback = message?.reasoning || message?.reasoning_content;
    if (fallback && typeof fallback === "string" && fallback.trim()) {
      content = fallback;
    }
  }

  if (content === undefined || content === null || typeof content !== "string") {
    throw new Error("AI returned an empty response.");
  }

  return content;
}

async function safeReadText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "";
  }
}
