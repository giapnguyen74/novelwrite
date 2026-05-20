import { LLMClient, LLMGenerateInput, LLMGenerateResult } from "./LLMClient";

export class MockLLMClient implements LLMClient {
  public nextResponse = "Mocked LLM generation response content.";
  public lastInput?: LLMGenerateInput;

  async generate(input: LLMGenerateInput): Promise<LLMGenerateResult> {
    this.lastInput = input;
    return {
      text: this.nextResponse,
      usage: {
        inputTokens: 100,
        outputTokens: 50,
      },
    };
  }

  async streamGenerate(
    input: LLMGenerateInput,
    onToken: (chunk: string) => void
  ): Promise<LLMGenerateResult> {
    this.lastInput = input;
    // Chunk canned response by space tokens
    const words = this.nextResponse.split(" ");
    for (let i = 0; i < words.length; i++) {
      const chunk = words[i] + (i < words.length - 1 ? " " : "");
      onToken(chunk);
    }

    return {
      text: this.nextResponse,
      usage: {
        inputTokens: 100,
        outputTokens: 50,
      },
    };
  }
}
