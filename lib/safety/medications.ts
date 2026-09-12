export interface KnownMedication {
  names: string[];
  brandHints: string[];
  ingredients: string[];
  notes: string;
}

export const COMMON_OTC_MEDICATIONS: KnownMedication[] = [
  {
    names: ["dayquil", "dayquil cold", "vicks dayquil"],
    brandHints: ["dayquil"],
    ingredients: ["acetaminophen", "dextromethorphan", "phenylephrine"],
    notes: "DayQuil products often contain acetaminophen. Check the specific label.",
  },
  {
    names: ["nyquil", "vicks nyquil"],
    brandHints: ["nyquil"],
    ingredients: ["acetaminophen", "dextromethorphan", "doxylamine"],
    notes: "NyQuil products often contain acetaminophen. Check the specific label.",
  },
  {
    names: ["tylenol", "acetaminophen", "paracetamol"],
    brandHints: ["tylenol"],
    ingredients: ["acetaminophen"],
    notes: "Tylenol is acetaminophen.",
  },
  {
    names: ["advil", "motrin", "ibuprofen"],
    brandHints: ["advil", "motrin"],
    ingredients: ["ibuprofen"],
    notes: "Advil and Motrin are ibuprofen products.",
  },
  {
    names: ["aleve", "naproxen"],
    brandHints: ["aleve"],
    ingredients: ["naproxen"],
    notes: "Aleve is naproxen.",
  },
  {
    names: ["excedrin"],
    brandHints: ["excedrin"],
    ingredients: ["acetaminophen", "aspirin", "caffeine"],
    notes: "Many Excedrin products contain acetaminophen plus aspirin.",
  },
  {
    names: ["mucinex dm"],
    brandHints: ["mucinex dm"],
    ingredients: ["guaifenesin", "dextromethorphan"],
    notes: "Mucinex DM typically combines guaifenesin and dextromethorphan.",
  },
  {
    names: ["mucinex"],
    brandHints: ["mucinex"],
    ingredients: ["guaifenesin"],
    notes: "Plain Mucinex is usually guaifenesin only; combination versions differ.",
  },
  {
    names: ["benadryl", "diphenhydramine"],
    brandHints: ["benadryl"],
    ingredients: ["diphenhydramine"],
    notes: "Benadryl is diphenhydramine and can cause drowsiness.",
  },
  {
    names: ["claritin", "loratadine"],
    brandHints: ["claritin"],
    ingredients: ["loratadine"],
    notes: "Claritin is loratadine.",
  },
  {
    names: ["zyrtec", "cetirizine"],
    brandHints: ["zyrtec"],
    ingredients: ["cetirizine"],
    notes: "Zyrtec is cetirizine.",
  },
  {
    names: ["sudafed pe"],
    brandHints: ["sudafed"],
    ingredients: ["phenylephrine"],
    notes: "Some Sudafed products use phenylephrine; behind-the-counter versions may use pseudoephedrine. Check the label.",
  },
  {
    names: ["pepto", "pepto-bismol", "bismuth"],
    brandHints: ["pepto"],
    ingredients: ["bismuth subsalicylate"],
    notes: "Pepto-Bismol is bismuth subsalicylate.",
  },
  {
    names: ["tums", "calcium carbonate"],
    brandHints: ["tums"],
    ingredients: ["calcium carbonate"],
    notes: "Tums is calcium carbonate.",
  },
  {
    names: ["theraflu"],
    brandHints: ["theraflu"],
    ingredients: ["acetaminophen"],
    notes: "Many Theraflu products contain acetaminophen plus other ingredients. Confirm on the label.",
  },
];

const INGREDIENT_ALIASES: Record<string, string> = {
  apap: "acetaminophen",
  paracetamol: "acetaminophen",
  "acetylsalicylic acid": "aspirin",
  asa: "aspirin",
};

export function normalizeIngredient(value: string): string {
  const cleaned = value.trim().toLowerCase().replace(/\s+/g, " ");
  return INGREDIENT_ALIASES[cleaned] ?? cleaned;
}

export function lookupMedication(name: string): KnownMedication | undefined {
  const needle = name.trim().toLowerCase();
  const exact = COMMON_OTC_MEDICATIONS.find((med) =>
    med.names.some((n) => needle === n || needle.includes(n)),
  );
  return exact;
}

export function inferIngredients(name: string, provided?: string[]): string[] {
  const fromUser = (provided ?? []).map(normalizeIngredient).filter(Boolean);
  if (fromUser.length) return [...new Set(fromUser)];
  const known = lookupMedication(name);
  const merged = new Set([...fromUser, ...(known?.ingredients ?? [])]);
  return [...merged];
}

export function findDuplicateIngredients(
  existing: Array<{ name: string; activeIngredients: string[] }>,
  incomingName: string,
  incomingIngredients: string[],
): Array<{ ingredient: string; medications: string[] }> {
  const incoming = incomingIngredients.map(normalizeIngredient);
  const hits: Array<{ ingredient: string; medications: string[] }> = [];

  for (const ingredient of incoming) {
    const others = existing.filter((med) =>
      med.activeIngredients.map(normalizeIngredient).includes(ingredient),
    );
    if (others.length > 0) {
      hits.push({
        ingredient,
        medications: [...others.map((med) => med.name), incomingName],
      });
    }
  }

  return hits;
}

export const ACETAMINOPHEN_WARNING =
  "Do not combine acetaminophen-containing products. Several cold and pain products contain acetaminophen. Taking more than one at a time can accidentally exceed a safe daily amount. This app cannot calculate your total dose — check labels and ask a pharmacist if you are unsure.";

export const UNKNOWN_INTERACTION_MESSAGE =
  "This prototype does not look up or invent drug interactions. If you take prescription medicines, have liver or kidney disease, or are considering combining products, verify safety with a pharmacist or clinician.";
