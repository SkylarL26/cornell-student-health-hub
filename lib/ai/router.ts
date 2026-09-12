import type { IntentCategory } from "@/lib/types/health";

export function routeIntentsHeuristic(message: string): IntentCategory[] {
  const intents = new Set<IntentCategory>();
  if (
    /(sick|fever|throat|cough|nause|vomit|diarrhea|headache|congestion|pain|chills|symptom|ill)/i.test(
      message,
    )
  ) {
    intents.add("SYMPTOMS");
    intents.add("CARE_NAVIGATION");
  }
  if (
    /(dayquil|nyquil|tylenol|advil|ibuprofen|aleve|medicat|dose|pill|acetaminophen|took)\b/i.test(
      message,
    )
  ) {
    intents.add("MEDICATION");
  }
  if (/(where should i go|urgent care|er\b|emergency|campus health|get care|doctor)/i.test(message)) {
    intents.add("CARE_NAVIGATION");
  }
  if (/(sleep|insomnia|napped|bedtime|all[- ]nighter|tired)/i.test(message)) {
    intents.add("SLEEP");
  }
  if (/(appointment|what to tell|clinician|doctor visit|summary for)/i.test(message)) {
    intents.add("APPOINTMENT_PREP");
  }
  if (/(prelim|exam|midterm|quiz|lab|assignment|professor|class tomorrow|pset)/i.test(message)) {
    intents.add("ACADEMIC_SUPPORT");
  }

  if (intents.size === 0) {
    intents.add("SYMPTOMS");
    intents.add("CARE_NAVIGATION");
  }

  return [...intents];
}

export function followUpsFor(intents: IntentCategory[], message: string): string[] {
  const questions: string[] = [];
  if (intents.includes("SYMPTOMS")) {
    if (!/started|since|yesterday|today|hour/i.test(message)) {
      questions.push("When did the first symptom start?");
    }
    if (!/(breath|chest|911|unconscious|confus)/i.test(message)) {
      questions.push(
        "Are you having severe trouble breathing, severe chest pain, confusion, or any other emergency warning sign?",
      );
    }
  }
  if (intents.includes("MEDICATION") && !/\d+\s*mg/i.test(message)) {
    questions.push("If you know the dose on the label, what was it?");
  }
  if (intents.includes("ACADEMIC_SUPPORT") && !/(email|professor|message)/i.test(message)) {
    questions.push("Would you like a draft message for your professor? Nothing will be sent.");
  }
  return questions.slice(0, 3);
}
