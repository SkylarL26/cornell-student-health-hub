import {
  ACETAMINOPHEN_WARNING,
  findDuplicateIngredients,
  inferIngredients,
  lookupMedication,
  UNKNOWN_INTERACTION_MESSAGE,
} from "@/lib/safety/medications";
import type { DuplicateIngredientWarning, StudentHealthState } from "@/lib/types/health";

const MED_NAME_PATTERN =
  /\b(dayquil|nyquil|tylenol|acetaminophen|advil|motrin|ibuprofen|aleve|naproxen|excedrin|mucinex(?:\s+dm)?|benadryl|claritin|zyrtec|sudafed|theraflu|pepto|tums)\b/gi;

export function extractMedicationMentions(text: string): string[] {
  const found = text.match(MED_NAME_PATTERN) ?? [];
  return [...new Set(found.map((name) => name.replace(/\s+/g, " ")))];
}

export function medicationTakenAroundNoon(text: string): boolean {
  return /around noon|at noon|this afternoon|12:?00/i.test(text);
}

export function evaluateMedicationSafety(
  state: StudentHealthState,
  incomingName: string,
  incomingIngredients?: string[],
): DuplicateIngredientWarning[] {
  const ingredients = inferIngredients(incomingName, incomingIngredients);
  const duplicates = findDuplicateIngredients(
    state.medications.map((med) => ({
      name: med.name,
      activeIngredients: med.activeIngredients,
    })),
    incomingName,
    ingredients,
  );

  return duplicates.map((hit) => ({
    ingredient: hit.ingredient,
    medications: hit.medications,
    message:
      hit.ingredient === "acetaminophen"
        ? ACETAMINOPHEN_WARNING
        : `More than one logged product may contain ${hit.ingredient}. Check labels rather than combining automatically. ${UNKNOWN_INTERACTION_MESSAGE}`,
  }));
}

export function describeMedicationContext(state: StudentHealthState, text: string): string {
  const mentions = extractMedicationMentions(text);
  const known = mentions
    .map((name) => lookupMedication(name))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const lines: string[] = [];
  if (known.length > 0) {
    lines.push(
      known
        .map(
          (med) =>
            `${med.names[0]} is a common OTC product. Typical label ingredients include ${med.ingredients.join(", ")}. Confirm on your package — formulations vary.`,
        )
        .join(" "),
    );
  } else if (mentions.length === 0 && state.medications.length === 0) {
    lines.push(
      "If you tell me the product name, dose, and time, I can add it to your timeline and check for duplicate active ingredients among common OTC products.",
    );
  }

  lines.push(UNKNOWN_INTERACTION_MESSAGE);
  return lines.join(" ");
}
