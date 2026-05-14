import { NextResponse } from "next/server";

type Body = { text?: unknown };

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = body.text;
  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json(
      { error: "Non-empty string field `text` is required." },
      { status: 400 }
    );
  }

  const trimmed = text.trim();
  const stub = trimmed.split(/\s+/).reverse().join(" ").slice(0, 4000);

  return NextResponse.json({
    result: `[Stub rewrite] Wire this route to your model. Word-order flip preview: ${stub}`,
  });
}
