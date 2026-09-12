export interface RedFlagMatch {
  id: string;
  label: string;
  reason: string;
}

const PATTERNS: Array<{ id: string; label: string; reason: string; tests: RegExp[] }> = [
  {
    id: "breathing",
    label: "Severe difficulty breathing",
    reason: "Severe trouble breathing can be an emergency.",
    tests: [
      /can['’]?t breathe/i,
      /cannot breathe/i,
      /severe (difficulty|trouble) breathing/i,
      /gasping for air/i,
      /blue lips/i,
      /turning blue/i,
    ],
  },
  {
    id: "chest",
    label: "Severe chest pain",
    reason: "Severe chest pain should be treated as an emergency until a clinician says otherwise.",
    tests: [/severe chest pain/i, /crushing chest/i, /chest (pain|pressure).*(arm|jaw|sweat)/i],
  },
  {
    id: "unconscious",
    label: "Loss of consciousness",
    reason: "Passing out or being unresponsive needs emergency evaluation.",
    tests: [
      /lost consciousness/i,
      /passed out/i,
      /unresponsive/i,
      /unconscious/i,
      /fainted and (didn'?t|did not) wake/i,
    ],
  },
  {
    id: "confusion",
    label: "Confusion or difficulty staying awake",
    reason: "New confusion or inability to stay awake can be urgent.",
    tests: [
      /can'?t stay awake/i,
      /cannot stay awake/i,
      /new confusion/i,
      /(?:i am|i['’]?m|feeling) confused/i,
      /disoriented/i,
      /doesn'?t make sense/i,
    ],
  },
  {
    id: "allergy",
    label: "Possible severe allergic reaction",
    reason: "Swelling of the face, lips, or throat with trouble breathing can be anaphylaxis.",
    tests: [
      /throat (is )?closing/i,
      /swelling (of )?(my )?(face|lips|tongue|throat)/i,
      /anaphylaxis/i,
      /hives.*(breath|throat)/i,
    ],
  },
  {
    id: "suicide",
    label: "Thoughts of self-harm",
    reason: "Immediate professional support is needed.",
    tests: [/suicid/i, /kill myself/i, /want to die/i, /self[- ]harm/i],
  },
  {
    id: "seizure",
    label: "Seizure",
    reason: "A seizure, especially a first seizure, needs urgent evaluation.",
    tests: [/seizure/i, /convuls/i],
  },
  {
    id: "bleeding",
    label: "Coughing or vomiting blood",
    reason: "Coughing or vomiting blood should be evaluated urgently.",
    tests: [/cough(ing)? (up )?blood/i, /vomit(ing)? blood/i, /bloody vomit/i],
  },
  {
    id: "stiff-neck",
    label: "Fever with severe stiff neck",
    reason: "Fever plus a severe stiff neck can be an emergency warning sign.",
    tests: [/stiff neck/i, /can'?t touch (my )?chin to (my )?chest/i],
  },
  {
    id: "dehydration",
    label: "Unable to keep fluids down",
    reason: "Repeated vomiting with no fluid intake can become dangerous quickly.",
    tests: [
      /can'?t keep (anything|fluids|water) down/i,
      /cannot keep (anything|fluids|water) down/i,
      /vomiting all day/i,
    ],
  },
];

export const RED_FLAG_CHECKLIST: Array<{ id: string; label: string }> = [
  { id: "breathing", label: "Severe difficulty breathing or gasping for air" },
  { id: "chest", label: "Severe chest pain or pressure" },
  { id: "unconscious", label: "Passed out, unresponsive, or hard to wake" },
  { id: "confusion", label: "New confusion or not thinking clearly" },
  { id: "allergy", label: "Face, lip, or throat swelling, or throat closing" },
  { id: "seizure", label: "Seizure" },
  { id: "bleeding", label: "Coughing or vomiting blood" },
  { id: "stiff-neck", label: "Fever with a severe stiff neck" },
  { id: "dehydration", label: "Unable to keep any fluids down" },
  { id: "suicide", label: "Thoughts of suicide or self-harm" },
];

export function detectRedFlags(text: string): RedFlagMatch[] {
  const matches: RedFlagMatch[] = [];
  for (const pattern of PATTERNS) {
    if (pattern.tests.some((test) => {
      const match = test.exec(text);
      if (!match) return false;
      const prefix = text.slice(0, match.index);
      return !/\b(?:no|not|without|denies|denying)\s+(?:(?:any|current|history of)\s+)?$/i.test(prefix);
    })) {
      matches.push({
        id: pattern.id,
        label: pattern.label,
        reason: pattern.reason,
      });
    }
  }
  return matches;
}

export function redFlagsFromIds(ids: string[]): RedFlagMatch[] {
  return RED_FLAG_CHECKLIST.filter((item) => ids.includes(item.id)).map((item) => {
    const full = PATTERNS.find((pattern) => pattern.id === item.id);
    return {
      id: item.id,
      label: item.label,
      reason: full?.reason ?? "This may require emergency care.",
    };
  });
}
