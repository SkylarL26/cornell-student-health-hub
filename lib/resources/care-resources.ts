export interface CareResource {
  id: string;
  name: string;
  category: "emergency" | "campus" | "urgent" | "pharmacy" | "mental_health" | "after_hours";
  summary: string;
  notes: string;
  url?: string;
  phone?: string;
}

/**
 * Campus-oriented placeholders. Hours, eligibility, and policies change —
 * keep this file as the single configurable source instead of scattering
 * potentially outdated details through the UI.
 */
export const CARE_RESOURCES: CareResource[] = [
  {
    id: "911",
    name: "Emergency services (911)",
    category: "emergency",
    summary: "Call 911 for life-threatening symptoms or if you are unsure and symptoms are severe.",
    notes: "This app cannot dispatch emergency care. If you think you need 911, call.",
    phone: "911",
  },
  {
    id: "cayuga-ed",
    name: "Local emergency department",
    category: "emergency",
    summary: "Use the nearest emergency department for emergency warning signs.",
    notes: "Confirm current location and wait times independently. Do not rely on this prototype for facility status.",
  },
  {
    id: "cornell-health",
    name: "Cornell Health",
    category: "campus",
    summary: "Same-day and scheduled visits are typically handled by campus health for enrolled students.",
    notes:
      "Hours, appointment types, and after-hours processes change. Check the official campus health website or phone line before you go.",
    url: "https://health.cornell.edu/get-care/appointments",
    phone: "607-255-5155",
  },
  {
    id: "urgent-care",
    name: "Ithaca-area urgent care",
    category: "urgent",
    summary: "Urgent care can be appropriate when you need prompt evaluation and it is not an emergency.",
    notes: "Verify hours, insurance, and whether they see students. Do not use this list as a live directory.",
  },
  {
    id: "pharmacy",
    name: "Campus or community pharmacy",
    category: "pharmacy",
    summary: "Pharmacists can help check ingredients, duplicates, and whether a product is appropriate.",
    notes: "This app does not calculate doses or drug interactions.",
    url: "https://health.cornell.edu/services/pharmacy",
  },
  {
    id: "caps",
    name: "Counseling and Psychological Services",
    category: "mental_health",
    summary: "Use campus mental health resources for distress, crisis, or if you are not sure where to start.",
    notes: "If you are in immediate danger, call 911. For mental health crisis support, also consider 988.",
    phone: "988",
    url: "https://health.cornell.edu/services/mental-health-care",
  },
];

export function resourcesForLevel(
  level: "self_care" | "routine_appointment" | "same_day_campus" | "urgent_care" | "emergency",
): CareResource[] {
  if (level === "emergency") {
    return CARE_RESOURCES.filter((r) => r.category === "emergency" || r.category === "mental_health");
  }
  if (level === "urgent_care") {
    return CARE_RESOURCES.filter((r) =>
      ["urgent", "campus", "emergency", "pharmacy"].includes(r.category),
    );
  }
  if (level === "same_day_campus" || level === "routine_appointment") {
    return CARE_RESOURCES.filter((r) =>
      ["campus", "pharmacy", "after_hours"].includes(r.category),
    );
  }
  return CARE_RESOURCES.filter((r) => ["campus", "pharmacy"].includes(r.category));
}
