import { LLMClient, LLMGenerateInput, LLMGenerateResult } from "./LLMClient";

export type OpenAIClientConfig = {
  baseUrl: string;
  apiKey?: string;
  model: string;
  headers?: Record<string, string>;
};

export class OpenAIClient implements LLMClient {
  constructor(private config: OpenAIClientConfig) {}

  async generate(input: LLMGenerateInput): Promise<LLMGenerateResult> {
    const url = `${this.config.baseUrl}/chat/completions`;
    
    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...(this.config.headers ?? {}),
    };

    if (this.config.apiKey) {
      requestHeaders["Authorization"] = `Bearer ${this.config.apiKey}`;
    }

    const body = {
      model: this.config.model,
      messages: input.messages,
      temperature: input.temperature ?? 0.7,
      max_tokens: input.maxOutputTokens,
    };

    const res = await fetch(url, {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify(body),
      signal: input.signal,
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      throw new Error(`OpenAI proxy error (status ${res.status}): ${errorText || res.statusText}`);
    }

    const data = (await res.json()) as any;
    const choice = data.choices?.[0];
    if (!choice || !choice.message) {
      throw new Error("OpenAI proxy returned an empty choice list.");
    }

    return {
      text: choice.message.content || "",
      usage: {
        inputTokens: data.usage?.prompt_tokens,
        outputTokens: data.usage?.completion_tokens,
      },
    };
  }

  async streamGenerate(
    input: LLMGenerateInput,
    onToken: (chunk: string) => void
  ): Promise<LLMGenerateResult> {
    const url = `${this.config.baseUrl}/chat/completions`;
    
    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...(this.config.headers ?? {}),
    };

    if (this.config.apiKey) {
      requestHeaders["Authorization"] = `Bearer ${this.config.apiKey}`;
    }

    const body = {
      model: this.config.model,
      messages: input.messages,
      temperature: input.temperature ?? 0.7,
      max_tokens: input.maxOutputTokens,
      stream: true,
    };

    const res = await fetch(url, {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify(body),
      signal: input.signal,
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      throw new Error(`OpenAI proxy error (status ${res.status}): ${errorText || res.statusText}`);
    }

    const reader = res.body?.getReader();
    if (!reader) {
      // Fallback if res.body is not streamable
      return this.generate(input);
    }

    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let fullText = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // Keep the last partial line in the buffer
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith("data: ")) {
            const dataStr = trimmed.slice(6).trim();
            if (dataStr === "[DONE]") {
              break;
            }

            try {
              const data = JSON.parse(dataStr);
              const deltaContent = data.choices?.[0]?.delta?.content;
              if (deltaContent) {
                fullText += deltaContent;
                onToken(deltaContent);
              }
            } catch (e) {
              // Ignore partial or malformed line parser errors during streaming
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return {
      text: fullText,
    };
  }
}
