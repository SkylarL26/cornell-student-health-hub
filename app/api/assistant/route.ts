import { assistantRequestSchema } from "@/lib/ai/schemas";
import { orchestrate } from "@/lib/ai/orchestrator";
import type { StudentHealthState } from "@/lib/types/health";

export async function POST(request: Request) {
  let json: unknown;
  try {
    const body = await request.text();
    if (body.length > 250000) return Response.json({ error: "Request too large. Clear older notes or use the local forms." }, { status: 413 });
    json = JSON.parse(body);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = assistantRequestSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const result = await orchestrate({
    message: parsed.data.message,
    timezoneOffset: parsed.data.timezoneOffset,
    state: parsed.data.state as StudentHealthState,
  });

  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
