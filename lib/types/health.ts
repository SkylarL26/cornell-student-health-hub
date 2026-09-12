export const SYMPTOM_OPTIONS = [
  { value: "fever", label: "Fever" },
  { value: "sore_throat", label: "Sore throat" },
  { value: "headache", label: "Headache" },
  { value: "cough", label: "Cough" },
  { value: "nausea", label: "Nausea" },
  { value: "fatigue", label: "Fatigue" },
  { value: "vomiting", label: "Vomiting" },
  { value: "diarrhea", label: "Diarrhea" },
  { value: "pain", label: "Pain" },
  { value: "congestion", label: "Congestion" },
  { value: "other", label: "Other" },
] as const;

export type SymptomName = (typeof SYMPTOM_OPTIONS)[number]["value"];
export type SymptomTrend = "improving" | "stable" | "worsening" | "unknown";
export type Severity = 1 | 2 | 3 | 4 | 5;
export type EnergyLevel = 1 | 2 | 3 | 4 | 5;
export type ObligationType = "class" | "lab" | "exam" | "assignment";
export type HealthTaskKind = "appointment" | "refill" | "follow_up" | "other";
export type MedicationSource = "manual" | "assistant" | "label_image";
export type CareLevel =
  | "self_care"
  | "routine_appointment"
  | "same_day_campus"
  | "urgent_care"
  | "emergency";

export const INTENT_CATEGORIES = [
  "SYMPTOMS",
  "MEDICATION",
  "CARE_NAVIGATION",
  "SLEEP",
  "APPOINTMENT_PREP",
  "ACADEMIC_SUPPORT",
] as const;

export type IntentCategory = (typeof INTENT_CATEGORIES)[number];

export interface ActiveSymptom {
  id: string;
  name: SymptomName;
  customLabel?: string;
  severity: Severity | null;
  startedAt: string;
  trend: SymptomTrend;
  notes?: string;
}

export interface SymptomHistoryEntry {
  id: string;
  at: string;
  symptomId: string;
  name: SymptomName;
  severity: Severity | null;
  trend: SymptomTrend;
}

export interface TemperatureReading {
  id: string;
  at: string;
  fahrenheit: number;
}

export interface MedicationEntry {
  id: string;
  name: string;
  dose: string;
  takenAt: string;
  activeIngredients: string[];
  source: MedicationSource;
  notes?: string;
}

export interface SleepLog {
  id: string;
  date: string;
  bedtime: string;
  wakeTime: string;
  durationHours: number;
  energy: EnergyLevel;
  notes?: string;
}

export interface HydrationLog {
  id: string;
  at: string;
  glasses: number;
  meals: string;
}

export interface AcademicObligation {
  id: string;
  title: string;
  course?: string;
  type: ObligationType;
  startsAt: string;
  notes?: string;
}

export interface HealthTask {
  id: string;
  title: string;
  kind: HealthTaskKind;
  dueAt?: string;
  done: boolean;
}

export interface UpcomingAppointment {
  id: string;
  title: string;
  at: string;
  location?: string;
  notes?: string;
}

export interface SickDayPlanItem {
  id: string;
  category: "hydration" | "meals" | "rest" | "check" | "follow_up" | "other";
  text: string;
  done: boolean;
}

export interface SickDayPlan {
  generatedAt: string;
  items: SickDayPlanItem[];
}

export interface CareRecommendation {
  level: CareLevel;
  reasons: string[];
  generatedAt: string;
}

export interface StudentHealthState {
  version: 1;
  updatedAt: string;
  activeSymptoms: ActiveSymptom[];
  symptomHistory: SymptomHistoryEntry[];
  temperatureHistory: TemperatureReading[];
  medications: MedicationEntry[];
  sleepHistory: SleepLog[];
  hydration: HydrationLog[];
  academicObligations: AcademicObligation[];
  healthTasks: HealthTask[];
  upcomingAppointments: UpcomingAppointment[];
  importantNegatives?: string;
  sickDayPlan?: SickDayPlan;
  lastCareRecommendation?: CareRecommendation;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  intents?: IntentCategory[];
  emergency?: boolean;
}

export interface DuplicateIngredientWarning {
  ingredient: string;
  medications: string[];
  message: string;
}

export interface StateMutations {
  symptoms?: ActiveSymptom[];
  temperatures?: TemperatureReading[];
  medications?: MedicationEntry[];
  obligations?: AcademicObligation[];
  sleepLogs?: SleepLog[];
  hydration?: HydrationLog[];
  tasks?: HealthTask[];
  appointments?: UpcomingAppointment[];
  importantNegatives?: string;
  sickDayPlan?: SickDayPlan;
  careRecommendation?: CareRecommendation;
}

export interface AssistantResponse {
  reply: string;
  intents: IntentCategory[];
  followUpQuestions: string[];
  emergency: boolean;
  emergencyReasons: string[];
  duplicateWarnings: DuplicateIngredientWarning[];
  careRecommendation?: CareRecommendation;
  professorDraft?: string;
  appointmentSummary?: string;
  mutations: StateMutations;
  usedAi: boolean;
}

export function symptomLabel(name: SymptomName, customLabel?: string): string {
  if (name === "other" && customLabel) return customLabel;
  return SYMPTOM_OPTIONS.find((option) => option.value === name)?.label ?? name;
}
