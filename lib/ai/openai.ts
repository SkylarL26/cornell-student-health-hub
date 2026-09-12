import OpenAI from "openai";
import { routerResultSchema } from "@/lib/ai/schemas";
import { followUpsFor, routeIntentsHeuristic } from "@/lib/ai/router";
import type { IntentCategory } from "@/lib/types/health";

export function hasOpenAI(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

function client(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 10000, maxRetries: 0 });
}

const SYSTEM_ROUTER = `You route student health-support messages for a Cornell student prototype.
Return JSON only: {"intents":[],"extracted":{"symptoms":[],"medications":[],"academic":"","followUpQuestions":[]}}
Allowed intents: SYMPTOMS, MEDICATION, CARE_NAVIGATION, SLEEP, APPOINTMENT_PREP, ACADEMIC_SUPPORT.
Select every relevant intent. Never diagnose. Never invent drug interactions or doses.`;

export async function routeWithAI(
  message: string,
): Promise<{ intents: IntentCategory[]; followUpQuestions: string[]; usedAi: boolean }> {
  const fallbackIntents = routeIntentsHeuristic(message);
  const fallbackQuestions = followUpsFor(fallbackIntents, message);

  if (!hasOpenAI()) {
    return { intents: fallbackIntents, followUpQuestions: fallbackQuestions, usedAi: false };
  }

  try {
    const completion = await client().chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_ROUTER },
        { role: "user", content: message },
      ],
    });
    const parsed = routerResultSchema.safeParse(
      JSON.parse(completion.choices[0]?.message?.content ?? "{}"),
    );
    if (!parsed.success) {
      return { intents: fallbackIntents, followUpQuestions: fallbackQuestions, usedAi: false };
    }
    return {
      intents: [...new Set([...fallbackIntents, ...parsed.data.intents])],
      followUpQuestions: parsed.data.extracted?.followUpQuestions?.slice(0, 3) ?? fallbackQuestions,
      usedAi: true,
    };
  } catch {
    return { intents: fallbackIntents, followUpQuestions: fallbackQuestions, usedAi: false };
  }
}

export async function synthesizeReply(options: {
  message: string;
  deterministic: string;
  emergency: boolean;
}): Promise<string> {
  if (!hasOpenAI() || options.emergency) {
    return options.deterministic;
  }

  try {
    const completion = await client().chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `Rewrite the provided safety-checked notes into one calm, coordinated assistant reply for a college student.
Rules:
- Do not diagnose. Never say the student "has" a specific disease.
- Do not invent doses, interactions, or contraindications.
- Do not claim to be Cornell Health.
- Keep emergency guidance if present.
- Prefer "may warrant evaluation" language.
- Keep under 280 words.
- Use short paragraphs.`,
        },
        {
          role: "user",
          content: `Student message:\n${options.message}\n\nDeterministic notes to preserve:\n${options.deterministic}`,
        },
      ],
    });
    return completion.choices[0]?.message?.content?.trim() || options.deterministic;
  } catch {
    return options.deterministic;
  }
}
