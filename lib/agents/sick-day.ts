import { createId } from "@/lib/utils";
import type {
  ActiveSymptom,
  SickDayPlan,
  StudentHealthState,
  SymptomName,
  SymptomTrend,
} from "@/lib/types/health";
import { symptomLabel } from "@/lib/types/health";

const REST_GUIDANCE: Partial<Record<SymptomName, string>> = {
  fever: "Rest in a cool, comfortable space and recheck temperature if you feel worse.",
  sore_throat: "Sip warm or cold fluids, whichever is easier, and avoid straining your voice.",
  cough: "Sit upright when coughing and rest your voice when you can.",
  nausea: "Try small sips of fluid; wait on large meals until your stomach settles.",
  vomiting: "Pause solid food until vomiting slows; restart with small sips of fluid.",
  diarrhea: "Prioritize fluids and simple foods if you can keep them down.",
  headache: "Dim lights, rest, and avoid stacking extra pain products without checking ingredients.",
  congestion: "A humidifier or steamy shower can feel soothing; fluids still matter.",
  fatigue: "Short rest blocks usually help more than pushing through a full day.",
  pain: "Note where it is and whether it is changing — that helps a clinician later.",
};

export function buildSickDayPlan(state: StudentHealthState): SickDayPlan {
  const items: SickDayPlan["items"] = [
    {
      id: createId("plan"),
      category: "hydration",
      text: "Drink fluids regularly today (water, broth, or an oral rehydration drink). Small sips count if you feel nauseated.",
      done: false,
    },
    {
      id: createId("plan"),
      category: "meals",
      text: "Eat simple meals if you can — toast, rice, yogurt, soup, or whatever stays down. Skipping food entirely is not required if you feel hungry.",
      done: false,
    },
    {
      id: createId("plan"),
      category: "rest",
      text: "Protect sleep: cancel nonessential plans and take rest breaks between any academic work you still need to do.",
      done: false,
    },
    {
      id: createId("plan"),
      category: "check",
      text: "Recheck how you feel this evening. If you have a thermometer, log temperature when feverish or if symptoms worsen.",
      done: false,
    },
  ];

  for (const symptom of state.activeSymptoms) {
    const extra = REST_GUIDANCE[symptom.name];
    if (extra) {
      items.push({
        id: createId("plan"),
        category: "other",
        text: `${symptomLabel(symptom.name, symptom.customLabel)}: ${extra}`,
        done: false,
      });
    }
  }

  if (state.academicObligations.some((item) => new Date(item.startsAt).getTime() >= Date.now() && new Date(item.startsAt).getTime() - Date.now() < 48 * 36e5)) {
    items.push({
      id: createId("plan"),
      category: "other",
      text: "If an exam or class is soon, decide tonight whether you can attend safely. Draft a professor message rather than disappearing.",
      done: false,
    });
  }

  items.push({
    id: createId("plan"),
    category: "follow_up",
    text: "Seek in-person care if you develop emergency warning signs, cannot keep fluids down, or feel significantly worse. This plan is not a diagnosis.",
    done: false,
  });

  return { generatedAt: new Date().toISOString(), items };
}

export function describeSickDay(state: StudentHealthState): string {
  if (state.activeSymptoms.length === 0) {
    return "I can help you build a sick-day plan once symptoms, timing, and anything you have already taken are in your health state.";
  }

  const names = state.activeSymptoms
    .map((s) => `${symptomLabel(s.name, s.customLabel)} (${s.trend}, severity ${s.severity === null ? "not provided" : `${s.severity}/5`})`)
    .join("; ");
  const temps = state.temperatureHistory.slice(-3);
  const tempLine =
    temps.length > 0
      ? ` Recent temperatures: ${temps.map((t) => `${t.fahrenheit}°F`).join(", ")}.`
      : "";

  return `Based on what you logged — ${names}.${tempLine} A conservative sick-day plan is rest, fluids, simple meals, and a planned check-in later today. This is organizational support, not a diagnosis or a prediction of what is causing your symptoms.`;
}

export function parseSymptomHints(text: string): Array<{
  name: SymptomName;
  customLabel?: string;
}> {
  const hints: Array<{ name: SymptomName; customLabel?: string }> = [];
  const rules: Array<[RegExp, SymptomName]> = [
    [/sore throat/i, "sore_throat"],
    [/fever|febrile/i, "fever"],
    [/headache/i, "headache"],
    [/cough/i, "cough"],
    [/nause/i, "nausea"],
    [/fatigu|exhausted|worn out/i, "fatigue"],
    [/vomit/i, "vomiting"],
    [/diarrhea|loose stool/i, "diarrhea"],
    [/congestion|stuffy|runny nose/i, "congestion"],
    [/\bpain\b/i, "pain"],
  ];
  for (const [pattern, name] of rules) {
    const affirmative = text.split(/[.!?;]|\bbut\b/i).filter((clause) => !/\b(no|without|denies|not|don['’]?t|haven['’]?t)\b/i.test(clause)).join(". ");
    if (pattern.test(affirmative) && !hints.some((h) => h.name === name)) {
      hints.push({ name });
    }
  }
  return hints;
}

export function defaultSymptomFromHint(
  hint: { name: SymptomName; customLabel?: string },
  startedAt?: string,
): Omit<ActiveSymptom, "id"> {
  return {
    name: hint.name,
    customLabel: hint.customLabel,
    severity: null,
    startedAt: startedAt ?? new Date().toISOString(),
    notes: "Extracted from text. Severity and trend are unknown; confirm using the sick-day form. Onset is approximate unless provided.",
    trend: "unknown" as SymptomTrend,
  };
}
