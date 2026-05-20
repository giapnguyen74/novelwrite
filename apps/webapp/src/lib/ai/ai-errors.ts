export type AiErrorCode =
  | "missing_config"
  | "network_or_cors"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "rate_limited"
  | "server_error"
  | "empty_output"
  | "unknown";

export class AiError extends Error {
  constructor(
    public code: AiErrorCode,
    message: string,
    public detail?: string,
  ) {
    super(message);
    this.name = "AiError";
  }
}

export function normalizeAiError(error: unknown): AiError {
  if (error instanceof AiError) return error;

  return new AiError(
    "network_or_cors",
    "Could not reach the AI proxy. Check that it is running and allows browser requests.",
    error instanceof Error ? error.message : String(error)
  );
}

export function mapAiHttpError(status: number, body: string): AiError {
  if (status === 401) {
    return new AiError("unauthorized", "Check your AI proxy API key.", body);
  }

  if (status === 403) {
    return new AiError("forbidden", "This proxy denied access to the selected model.", body);
  }

  if (status === 404) {
    return new AiError(
      "not_found",
      "The proxy endpoint was not found. Use an OpenAI-compatible `/v1` base URL.",
      body
    );
  }

  if (status === 429) {
    return new AiError("rate_limited", "The AI proxy or provider rate-limited the request.", body);
  }

  if (status >= 500) {
    return new AiError("server_error", "The AI proxy or provider returned a server error.", body);
  }

  return new AiError("unknown", `AI request failed with status ${status}.`, body);
}
