import { CARE_LEVEL_COPY } from "@/lib/safety/care-levels";
import { resourcesForLevel } from "@/lib/resources/care-resources";
import type { CareRecommendation } from "@/lib/types/health";

export function describeCareNavigation(recommendation: CareRecommendation): string {
  const copy = CARE_LEVEL_COPY[recommendation.level];
  const resources = resourcesForLevel(recommendation.level)
    .slice(0, 3)
    .map((resource) => resource.name)
    .join("; ");

  return [
    `Suggested next step (not a diagnosis): ${copy.title}. ${copy.summary}`,
    recommendation.reasons.join(" "),
    `Configurable local resources to review (verify hours yourself): ${resources}.`,
  ].join(" ");
}
