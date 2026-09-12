import { healthStateSchema } from "./schema";
import type { StudentHealthState } from "@/lib/types/health";

export const STORAGE_KEY = "csh-hub-health-state-v1";

export function emptyHealthState(): StudentHealthState {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    activeSymptoms: [],
    symptomHistory: [],
    temperatureHistory: [],
    medications: [],
    sleepHistory: [],
    hydration: [],
    academicObligations: [],
    healthTasks: [],
    upcomingAppointments: [],
  };
}

export function isHealthState(value: unknown): value is StudentHealthState {
  return healthStateSchema.safeParse(value).success;
}
