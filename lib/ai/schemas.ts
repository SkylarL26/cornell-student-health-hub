import { healthStateSchema } from "@/lib/storage/schema";
import { z } from "zod";
import { INTENT_CATEGORIES } from "@/lib/types/health";

export const assistantRequestSchema = z.object({
  timezoneOffset: z.number().int().min(-840).max(840).optional(),
  message: z.string().trim().min(1).max(4000),
  conversation: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(12000),
      }),
    )
    .max(12)
    .optional(),
  state: healthStateSchema,
});

export const routerResultSchema = z.object({
  intents: z.array(z.enum(INTENT_CATEGORIES)).min(1),
  extracted: z
    .object({
      symptoms: z.array(z.string()).optional(),
      medications: z.array(z.string()).optional(),
      academic: z.string().optional(),
      followUpQuestions: z.array(z.string()).max(4).optional(),
    })
    .optional(),
});
