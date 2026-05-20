export type LLMGenerateInput = {
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  temperature?: number;
  maxOutputTokens?: number;
  signal?: AbortSignal;
};

export type LLMGenerateResult = {
  text: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
};

export interface LLMClient {
  generate(input: LLMGenerateInput): Promise<LLMGenerateResult>;
  streamGenerate?(
    input: LLMGenerateInput,
    onToken: (chunk: string) => void
  ): Promise<LLMGenerateResult>;
}
