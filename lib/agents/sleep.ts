import type { SleepLog, StudentHealthState } from "@/lib/types/health";

export function averageSleepHours(logs: SleepLog[], take = 5): number | null {
  const slice = logs.slice(-take);
  if (slice.length === 0) return null;
  return slice.reduce((sum, log) => sum + log.durationHours, 0) / slice.length;
}

export function describeSleepSupport(state: StudentHealthState): string {
  const last = state.sleepHistory.at(-1);
  if (!last) {
    return "Log last night's bedtime and wake time for a short, practical recovery suggestion. This is not a sleep-disorder diagnosis.";
  }

  const suggestions: string[] = [];
  if (last.durationHours < 6) {
    suggestions.push(
      "After a short night, a 20–30 minute rest (not a long late-afternoon nap) plus an earlier wind-down tonight usually helps more than caffeine stacking.",
    );
  } else if (last.durationHours > 9.5) {
    suggestions.push(
      "Longer sleep can be recovery — or a sign you still feel unwell. Keep the next bedtime consistent rather than swinging wildly.",
    );
  } else {
    suggestions.push("Your last logged sleep duration is in a reasonable college range. Keep the wake time as steady as you can.");
  }

  if (last.energy <= 2) {
    suggestions.push(
      "Low energy plus illness is a cue to reduce extra commitments today, not to interpret fatigue as a specific diagnosis.",
    );
  }

  const avg = averageSleepHours(state.sleepHistory);
  if (avg && avg < 6.5 && state.sleepHistory.length >= 3) {
    suggestions.push(
      `Recent logs average about ${avg.toFixed(1)} hours. Protecting one earlier night this week is a practical academic strategy, especially if you are also sick.`,
    );
  }

  return suggestions.join(" ");
}
