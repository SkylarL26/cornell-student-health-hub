import { z } from "zod";
import { SYMPTOM_OPTIONS } from "@/lib/types/health";
const text = z.string().max(4000);
const id = z.string().min(1).max(100);
const date = z.string().refine((s) => Number.isFinite(Date.parse(s)), "Invalid date");
const level = z.number().int().min(1).max(5);
const symptom = z.enum(SYMPTOM_OPTIONS.map((s) => s.value));
const trend = z.enum(["improving", "stable", "worsening", "unknown"]);
const list = <T extends z.ZodType>(item: T) => z.array(item).max(2000);
export const healthStateSchema = z.object({
  version: z.literal(1), updatedAt: date,
  importantNegatives: text.optional(),
  activeSymptoms: list(z.object({ id, name: symptom, customLabel: text.optional(), severity: level.nullable(), startedAt: date, trend, notes: text.optional() })),
  symptomHistory: list(z.object({ id, at: date, symptomId: id, name: symptom, severity: level.nullable(), trend })),
  temperatureHistory: list(z.object({ id, at: date, fahrenheit: z.number().min(90).max(115) })),
  medications: list(z.object({ id, name: text, dose: text, takenAt: date, activeIngredients: z.array(text).max(50), source: z.enum(["manual", "assistant", "label_image"]), notes: text.optional() })),
  sleepHistory: list(z.object({ id, date, bedtime: text, wakeTime: text, durationHours: z.number().min(0).max(24), energy: level, notes: text.optional() })),
  hydration: list(z.object({ id, at: date, glasses: z.number().min(0).max(100), meals: text })),
  academicObligations: list(z.object({ id, title: text, course: text.optional(), type: z.enum(["class", "lab", "exam", "assignment"]), startsAt: date, notes: text.optional() })),
  healthTasks: list(z.object({ id, title: text, kind: z.enum(["appointment", "refill", "follow_up", "other"]), dueAt: date.optional(), done: z.boolean() })),
  upcomingAppointments: list(z.object({ id, title: text, at: date, location: text.optional(), notes: text.optional() })),
  sickDayPlan: z.object({ generatedAt: date, items: list(z.object({ id, category: z.enum(["hydration", "meals", "rest", "check", "follow_up", "other"]), text, done: z.boolean() })) }).optional(),
  lastCareRecommendation: z.object({ level: z.enum(["self_care", "routine_appointment", "same_day_campus", "urgent_care", "emergency"]), reasons: z.array(text), generatedAt: date }).optional(),
});
