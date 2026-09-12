import { buildAppointmentSummary } from "@/lib/agents/appointment";
import { describeCareNavigation } from "@/lib/agents/care-nav";
import {
  describeAcademicSupport,
  draftProfessorMessage,
  extractAcademicHints,
  upcomingSoon,
} from "@/lib/agents/academic";
import {
  describeMedicationContext,
  evaluateMedicationSafety,
  extractMedicationMentions,
  medicationTakenAroundNoon,
} from "@/lib/agents/medication";
import {
  buildSickDayPlan,
  defaultSymptomFromHint,
  describeSickDay,
  parseSymptomHints,
} from "@/lib/agents/sick-day";
import { describeSleepSupport } from "@/lib/agents/sleep";
import { routeWithAI, synthesizeReply } from "@/lib/ai/openai";
import { recommendCareLevel } from "@/lib/safety/care-levels";
import { EMERGENCY_BANNER } from "@/lib/safety/disclaimers";
import { inferIngredients } from "@/lib/safety/medications";
import { detectRedFlags } from "@/lib/safety/red-flags";
import { relativeLocalHour, createId } from "@/lib/utils";
import type {
  AcademicObligation,
  ActiveSymptom,
  AssistantResponse,
  MedicationEntry,
  StateMutations,
  StudentHealthState,
  TemperatureReading,
} from "@/lib/types/health";

function extractTemperature(message: string): number | undefined {
  const match = message.match(/\b((?:9\d|10\d|11\d)(?:\.\d)?)\s*(?:°\s*)?F\b/i) ??
    message.match(/temperature(?: of)?\s+((?:9\d|10\d|11\d)(?:\.\d)?)/i);
  if (!match) return undefined;
  const value = Number.parseFloat(match[1] ?? "");
  return Number.isFinite(value) ? value : undefined;
}

function sinceYesterday(message: string): boolean {
  return /since yesterday|yesterday/i.test(message);
}

export async function orchestrate(options: {
  message: string;
  timezoneOffset?: number;
  state: StudentHealthState;
}): Promise<AssistantResponse> {
  const { message, state, timezoneOffset = new Date().getTimezoneOffset() } = options;
  const redFlags = detectRedFlags(message);
  if (redFlags.length > 0) {
    const careRecommendation = recommendCareLevel({ state, redFlags });
    return { reply: EMERGENCY_BANNER, intents: ["CARE_NAVIGATION"], followUpQuestions: [], emergency: true,
      emergencyReasons: redFlags.map((f) => f.reason), duplicateWarnings: [], careRecommendation,
      mutations: { careRecommendation }, usedAi: false };
  }
  const routed = await routeWithAI(message);
  const intents = routed.intents;

  const mutations: StateMutations = {};
  const sections: string[] = [];

  if (redFlags.length > 0) {
    sections.push(
      `${EMERGENCY_BANNER}\nDetected warning language: ${redFlags.map((f) => f.label).join("; ")}. This app cannot handle emergencies.`,
    );
  }

  if (intents.includes("SYMPTOMS")) {
    const hints = parseSymptomHints(message);
    const startedAt = sinceYesterday(message)
      ? new Date(Date.now() - 24 * 36e5).toISOString()
      : undefined;
    const newSymptoms: ActiveSymptom[] = hints
      .filter((hint) => !state.activeSymptoms.some((s) => s.name === hint.name))
      .map((hint) => ({
        id: createId("sx"),
        ...defaultSymptomFromHint(hint, startedAt),
      }));
    if (newSymptoms.length > 0) mutations.symptoms = newSymptoms;

    const temp = extractTemperature(message);
    if (typeof temp === "number") {
      const reading: TemperatureReading = {
        id: createId("temp"),
        at: new Date().toISOString(),
        fahrenheit: temp,
      };
      mutations.temperatures = [reading];
    }

    const nextState: StudentHealthState = {
      ...state,
      activeSymptoms: [...state.activeSymptoms, ...(mutations.symptoms ?? [])],
      temperatureHistory: [
        ...state.temperatureHistory,
        ...(mutations.temperatures ?? []),
      ],
    };
    mutations.sickDayPlan = buildSickDayPlan(nextState);
    sections.push(describeSickDay(nextState));
  }

  if (intents.includes("MEDICATION")) {
    const names = extractMedicationMentions(message);
    const meds: MedicationEntry[] = names.filter((name) => {
      const before = message.slice(0, message.toLowerCase().indexOf(name.toLowerCase()));
      return /\b(?:took|taken|had|used)\s+(?:\d+\s*(?:mg|ml|tablets?|pills?)?\s*(?:of\s+)?)?$/i.test(before) &&
        !/(?:haven['’]?t|have not|had not|never|not)\s+(?:yet\s+)?(?:took|taken|had|used)/i.test(before);
    }).map((name) => {
      const takenAt = medicationTakenAroundNoon(message)
        ? relativeLocalHour(12, /yesterday/i.test(message.split(/took/i).at(-1) ?? "") ? -1 : 0, timezoneOffset)
        : new Date().toISOString();
      return {
        id: createId("med"),
        name,
        dose: message.match(/\b\d+(?:\.\d+)?\s*(?:mg|ml|tablets?|pills?)\b/i)?.[0] ?? "Not provided — confirm label",
        takenAt,
        activeIngredients: inferIngredients(name),
        source: "assistant",
        notes: `Student report: ${message}. Time is estimated; confirm in the medication tracker.`,
      };
    });
    if (meds.length > 0) mutations.medications = meds;
    sections.push(describeMedicationContext(state, message));
  }

  const mentioned = extractMedicationMentions(message);
  const duplicateWarnings = mentioned.flatMap((name, index) =>
    evaluateMedicationSafety({ ...state, medications: [...state.medications, ...mentioned.slice(0, index).map((other) => ({ id: other, name: other, dose: "", takenAt: new Date().toISOString(), activeIngredients: inferIngredients(other), source: "assistant" as const }))] }, name),
  );
  if (duplicateWarnings.length > 0) {
    sections.push(duplicateWarnings.map((w) => w.message).join(" "));
  }

  const mergedForCare: StudentHealthState = {
    ...state,
    activeSymptoms: [...state.activeSymptoms, ...(mutations.symptoms ?? [])],
    temperatureHistory: [...state.temperatureHistory, ...(mutations.temperatures ?? [])],
    medications: [...state.medications, ...(mutations.medications ?? [])],
  };

  let careRecommendation = state.lastCareRecommendation;
  if (intents.includes("CARE_NAVIGATION") || intents.includes("SYMPTOMS") || redFlags.length > 0) {
    careRecommendation = recommendCareLevel({
      state: mergedForCare,
      redFlags,
      text: message,
    });
    mutations.careRecommendation = careRecommendation;
    sections.push(describeCareNavigation(careRecommendation));
  }

  if (intents.includes("SLEEP")) {
    sections.push(describeSleepSupport(state));
  }

  if (intents.includes("ACADEMIC_SUPPORT")) {
    const hint = extractAcademicHints(message, timezoneOffset);
    let obligation: AcademicObligation | undefined;
    if (hint?.title && !state.academicObligations.some((o) => o.course?.toLowerCase() === hint.course?.toLowerCase() && o.type === hint.type)) {
      obligation = {
        id: createId("ob"),
        title: hint.title,
        course: hint.course,
        type: hint.type ?? "exam",
        startsAt: hint.startsAt ?? new Date(Date.now() + 24 * 36e5).toISOString(),
        notes: hint.notes,
      };
      mutations.obligations = [obligation];
    }
    const next = {
      ...mergedForCare,
      academicObligations: [
        ...state.academicObligations,
        ...(mutations.obligations ?? []),
      ],
    };
    sections.push(describeAcademicSupport(next));
  }

  if (mutations.sickDayPlan) mutations.sickDayPlan = buildSickDayPlan({ ...mergedForCare, academicObligations: [...state.academicObligations, ...(mutations.obligations ?? [])] });

  const professorDraft = intents.includes("ACADEMIC_SUPPORT")
    ? draftProfessorMessage(
        {
          ...mergedForCare,
          academicObligations: [
            ...state.academicObligations,
            ...(mutations.obligations ?? []),
          ],
        },
        upcomingSoon(
          [...state.academicObligations, ...(mutations.obligations ?? [])],
          72,
        )[0],
      )
    : undefined;

  const appointmentSummary = intents.includes("APPOINTMENT_PREP")
    ? buildAppointmentSummary(mergedForCare)
    : undefined;
  if (appointmentSummary) {
    sections.push("A clinician-ready summary can be copied from the appointment page. It is not a medical record.");
  }

  sections.push(
    "Reminder: this prototype does not diagnose illness, does not replace professional care, and should not delay calling 911.",
  );

  const deterministic = sections.filter(Boolean).join("\n\n");
  const reply = await synthesizeReply({
    message,
    deterministic,
    emergency: redFlags.length > 0,
  });

  return {
    reply: duplicateWarnings.length ? `${reply}\n\nMedication safety: ${duplicateWarnings.map((w) => w.message).join(" ")}` : reply,
    intents,
    followUpQuestions: routed.followUpQuestions,
    emergency: redFlags.length > 0,
    emergencyReasons: redFlags.map((f) => f.reason),
    duplicateWarnings,
    careRecommendation,
    professorDraft,
    appointmentSummary,
    mutations,
    usedAi: routed.usedAi,
  };
}
