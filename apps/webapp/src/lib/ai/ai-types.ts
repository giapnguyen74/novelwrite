export type AiClientConfig = {
  baseUrl: string;
  apiKey?: string;
  model: string;
  headers?: Record<string, string>;
};

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatCompletionRequest = {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
};
