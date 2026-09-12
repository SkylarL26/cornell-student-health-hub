import type { CareLevel, CareRecommendation, StudentHealthState } from "@/lib/types/health";
import type { RedFlagMatch } from "@/lib/safety/red-flags";

export const CARE_LEVEL_COPY: Record<
  CareLevel,
  { title: string; summary: string }
> = {
  self_care: {
    title: "Self-care and monitoring",
    summary:
      "Symptoms appear compatible with rest, fluids, and watching for change — not a diagnosis. Seek care if you worsen or develop warning signs.",
  },
  routine_appointment: {
    title: "Routine appointment",
    summary:
      "A non-urgent visit may help if symptoms linger, you need documentation, or you want a clinician to review a recurring issue.",
  },
  same_day_campus: {
    title: "Same-day campus health evaluation",
    summary:
      "Fever, worsening symptoms, or illness that may affect classes often warrant same-day evaluation rather than waiting.",
  },
  urgent_care: {
    title: "Urgent care",
    summary:
      "You may need prompt in-person evaluation today, especially if symptoms are intense, not improving, or you cannot manage self-care safely.",
  },
  emergency: {
    title: "Emergency care",
    summary:
      "Warning signs suggest you should call 911 or go to an emergency department now. Do not wait for this app or an appointment.",
  },
};

function latestTemp(state: StudentHealthState): number | undefined {
  const last = state.temperatureHistory.at(-1);
  return last?.fahrenheit;
}

export function recommendCareLevel(options: {
  state: StudentHealthState;
  redFlags: RedFlagMatch[];
  text?: string;
}): CareRecommendation {
  const { state, redFlags, text = "" } = options;
  const reasons: string[] = [];
  const temp = latestTemp(state);
  const feverish =
    state.activeSymptoms.some((s) => s.name === "fever") ||
    (typeof temp === "number" && temp >= 100.4) ||
    /(?:i have|having) (?:a )?fever/i.test(text);
  const worsening = state.activeSymptoms.some((s) => s.trend === "worsening");
  const daysIll = state.activeSymptoms.reduce((max, symptom) => {
    const days =
      (Date.now() - new Date(symptom.startedAt).getTime()) / 86_400_000;
    return Math.max(max, days);
  }, 0);
  const vomiting = state.activeSymptoms.some((s) => s.name === "vomiting");
  const severe = state.activeSymptoms.some((s) => s.severity !== null && s.severity >= 4);

  if (redFlags.length > 0) {
    return {
      level: "emergency",
      reasons: redFlags.map((flag) => flag.reason),
      generatedAt: new Date().toISOString(),
    };
  }

  if (typeof temp === "number" && temp >= 103) {
    reasons.push(
      `A recorded temperature of ${temp.toFixed(1)}°F is high enough that same-day or urgent evaluation is often appropriate.`,
    );
    return {
      level: "urgent_care",
      reasons,
      generatedAt: new Date().toISOString(),
    };
  }

  if (vomiting && /can'?t keep|dehydrat/i.test(text)) {
    reasons.push(
      "Difficulty keeping fluids down can become urgent; in-person evaluation may be appropriate.",
    );
    return {
      level: "urgent_care",
      reasons,
      generatedAt: new Date().toISOString(),
    };
  }

  if (feverish && (worsening || daysIll >= 1 || severe)) {
    reasons.push(
      "Fever with other symptoms, especially if they are worsening or have lasted more than a day, may warrant a same-day campus health visit rather than guessing at a diagnosis.",
    );
    return {
      level: "same_day_campus",
      reasons,
      generatedAt: new Date().toISOString(),
    };
  }

  if (severe || worsening) {
    return { level: "same_day_campus", reasons: ["Severe or worsening symptoms may need evaluation today. Contact a clinician; if campus care is unavailable, consider urgent care. Emergency warning signs require 911."], generatedAt: new Date().toISOString() };
  }

  if (daysIll >= 3) {
    reasons.push(
      "Symptoms lasting several days or getting worse are a common reason to schedule an appointment instead of continuing self-care alone.",
    );
    return {
      level: "routine_appointment",
      reasons,
      generatedAt: new Date().toISOString(),
    };
  }

  if (!state.activeSymptoms.length && temp === undefined) {
    return { level: "self_care", reasons: ["There is not enough information to suggest a personalized care level. Log symptoms and review the warning signs first. You can contact Cornell Health for guidance whenever you are unsure."], generatedAt: new Date().toISOString() };
  }

  reasons.push(
    "No emergency warning signs were detected from the information provided. Self-care and close monitoring can be reasonable while you watch for change.",
  );
  if (feverish) {
    reasons.push(
      "Fever still deserves attention: rest, fluids, and a plan for when to seek in-person care if you worsen.",
    );
  }

  return {
    level: "self_care",
    reasons,
    generatedAt: new Date().toISOString(),
  };
}
