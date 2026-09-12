import { formatTime, relativeLocalHour } from "@/lib/utils";
import { symptomLabel } from "@/lib/types/health";
import type { AcademicObligation, StudentHealthState } from "@/lib/types/health";

export function upcomingSoon(obligations: AcademicObligation[], hours = 48): AcademicObligation[] {
  const now = Date.now();
  return obligations
    .filter((item) => {
      const start = new Date(item.startsAt).getTime();
      return start >= now - 2 * 36e5 && start <= now + hours * 36e5;
    })
    .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
}

export function extractAcademicHints(text: string, timezoneOffset = new Date().getTimezoneOffset()): Partial<AcademicObligation> | null {
  if (!/(prelim|exam|midterm|quiz|lab|assignment|problem set|pset|class tomorrow)/i.test(text)) {
    return null;
  }

  const tomorrow = relativeLocalHour(9, /today|tonight/i.test(text) ? 0 : 1, timezoneOffset);

  const isExam = /(prelim|exam|midterm|quiz)/i.test(text);
  const courseMatch = text.match(
    /\b(chemistry|chem|orgo|biology|bio|physics|math|cs|econ|psych|govt|english)\b/i,
  );

  return {
    title: isExam ? "Prelim / exam" : "Class or academic obligation",
    course: courseMatch?.[0],
    type: isExam ? "exam" : /lab/i.test(text) ? "lab" : /assignment|pset|problem set/i.test(text) ? "assignment" : "class",
    startsAt: tomorrow,
    notes: "Extracted from a free-text message — confirm the actual time.",
  };
}

export function draftProfessorMessage(state: StudentHealthState, obligation?: AcademicObligation): string {
  const symptoms =
    state.activeSymptoms.length > 0
      ? state.activeSymptoms.map((s) => symptomLabel(s.name, s.customLabel).toLowerCase()).join(" and ")
      : "an acute illness";

  const when = obligation
    ? `${obligation.course ? `${obligation.course} ` : ""}${obligation.title} on ${formatTime(obligation.startsAt)}`
    : "upcoming class";

  return [
    "Subject: Absence / academic adjustment due to illness",
    "",
    "Dear Professor,",
    "",
    `I am a student in your course and I am writing because I am unwell (${symptoms}) and may not be able to attend ${when} as planned.`,
    "",
    "Could you let me know the appropriate next step under your syllabus, such as a makeup or a short extension? I will keep you updated.",
    "",
    "Thank you for your time. I will follow any documentation process the course or university requires.",
    "",
    "Sincerely,",
    "[Your name]",
    "[NetID / course section]",
  ].join("\n");
}

export function describeAcademicSupport(state: StudentHealthState): string {
  const soon = upcomingSoon(state.academicObligations, 72);
  if (soon.length === 0) {
    return "If illness may collide with a class, lab, prelim, or assignment, add it under Health & Classes. I can then draft a message — I will not send anything.";
  }
  const list = soon
    .map((item) => `${item.course ? `${item.course} ` : ""}${item.title} (${formatTime(item.startsAt)})`)
    .join("; ");
  return `You have academic work soon: ${list}. If you cannot attend safely, notify the instructor early. A draft message is available — nothing is sent automatically.`;
}
