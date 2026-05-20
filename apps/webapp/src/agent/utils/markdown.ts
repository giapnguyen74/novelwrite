export function cleanPlainProse(raw: string): string {
  let text = raw.trim();

  // Strip <think>...</think> and <thought>...</thought> blocks (common in reasoning models like DeepSeek-R1)
  text = text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<thought>[\s\S]*?<\/thought>/gi, "")
    .trim();

  // Remove common markdown fences.
  text = text
    .replace(/^```(?:text|markdown)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // Remove common labels.
  text = text.replace(
    /^(rewritten passage|expanded passage|output|result|revision):\s*/i,
    ""
  );

  // Remove common assistant chatter.
  text = text.replace(/^(sure|of course|certainly|here'?s)[,.!:\s-]+/i, "").trim();

  // Remove wrapping quotes only if the whole output is wrapped.
  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("“") && text.endsWith("”"))
  ) {
    text = text.slice(1, -1).trim();
  }

  return text;
}

export function assertUsablePlainProse(text: string): string {
  const trimmed = text.trim();

  if (!trimmed) {
    throw new Error("The model returned no usable text.");
  }

  return trimmed;
}
