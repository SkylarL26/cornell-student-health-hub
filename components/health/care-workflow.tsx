"use client";

import { useState } from "react";
import { CopyButton } from "@/components/ui/copy-button";
import { Input, Label } from "@/components/ui/field";
import { downloadText } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmergencyAlert } from "@/components/safety/emergency-alert";
import { CARE_LEVEL_COPY, recommendCareLevel } from "@/lib/safety/care-levels";
import { CARE_RESOURCES, resourcesForLevel } from "@/lib/resources/care-resources";
import { RED_FLAG_CHECKLIST, redFlagsFromIds } from "@/lib/safety/red-flags";
import { buildAppointmentSummary } from "@/lib/agents/appointment";
import { useHealth } from "@/lib/storage/health-store";

export function CareWorkflow() {
  const { state, applyMutations, addAppointment } = useHealth();
  const [flagIds, setFlagIds] = useState<string[]>([]);
  const [visitTitle, setVisitTitle] = useState("");
  const [visitAt, setVisitAt] = useState("");
  const [saved, setSaved] = useState(false);
  const flags = redFlagsFromIds(flagIds);
  const recommendation = recommendCareLevel({ state, redFlags: flags });
  const copy = CARE_LEVEL_COPY[recommendation.level];
  const resources = resourcesForLevel(recommendation.level);
  const summary = buildAppointmentSummary(state);

  function recompute() {
    const next = recommendCareLevel({ state, redFlags: flags });
    applyMutations({ careRecommendation: next });
  }

  return (
    <div className="space-y-6">
      {recommendation.level === "emergency" || flags.length > 0 ? (
        <EmergencyAlert reasons={flags.map((f) => f.reason)} />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Where should I get care?</h2>
            <p className="mt-1 text-sm text-stone-600">
              This ranks a level of care from what you logged. It is not a diagnosis and does not book visits.
            </p>
          </CardHeader>
          <CardBody className="space-y-4">
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Any emergency warning signs right now?</legend>
              <div className="space-y-2">
                {RED_FLAG_CHECKLIST.map((item) => (
                  <label key={item.id} className="flex gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={flagIds.includes(item.id)}
                      onChange={(e) =>
                        setFlagIds((current) =>
                          e.target.checked
                            ? [...current, item.id]
                            : current.filter((id) => id !== item.id),
                        )
                      }
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <Button type="button" onClick={recompute}>
              Update care suggestion
            </Button>
            <div className="rounded-2xl bg-stone-900 p-5 text-white">
              <Badge tone="red">{copy.title}</Badge>
              <p className="mt-3 text-sm leading-relaxed text-stone-100">{copy.summary}</p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-stone-200">
                {recommendation.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Campus and local resources</h2>
            <p className="mt-1 text-sm text-stone-600">
              Use official resource pages to check current availability, appointment options, and eligibility before traveling.
            </p>
          </CardHeader>
          <CardBody className="space-y-3">
            {resources.map((resource) => (
              <div key={resource.id} className="rounded-xl border border-stone-100 p-3">
                <p className="font-medium">{resource.name}</p>
                <p className="text-sm text-stone-600">{resource.summary}</p>
                <p className="mt-1 text-xs text-stone-500">{resource.notes}</p>
                {resource.phone ? <a className="mt-2 block text-sm font-medium underline" href={`tel:${resource.phone}`}>Call {resource.phone}</a> : null}
                {resource.url ? (
                  <a className="mt-1 inline-block text-sm text-[var(--cornell-red)] underline" href={resource.url}>
                    Visit official website
                  </a>
                ) : null}
              </div>
            ))}
            <p className="text-xs text-stone-500">
              Full configurable list includes {CARE_RESOURCES.length} resources.
            </p>
          </CardBody>
        </Card>
      </div>

      <Card id="appointment" className="scroll-mt-40">
        <CardHeader>
          <h2 className="text-lg font-semibold">Prepare for an appointment</h2>
          <p className="mt-1 text-sm text-stone-600">
            Converts your session notes into a concise clinician-ready summary. Copy it — nothing is sent.
          </p>
        </CardHeader>
        <CardBody>
          <div className="mb-4"><Label htmlFor="negatives">Symptoms you specifically do not have (optional)</Label><Input id="negatives" placeholder="e.g. No vomiting — only record what you have checked" value={state.importantNegatives ?? ""} onChange={(e) => applyMutations({ importantNegatives: e.target.value })} /></div>
          <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-2xl bg-stone-50 p-4 text-sm leading-relaxed text-stone-800">
            {summary}
          </pre>
          <div className="mt-3 flex flex-wrap gap-2">
            <CopyButton text={summary} label="Copy summary" />
            <Button type="button" variant="secondary" onClick={() => downloadText(summary, "appointment-summary.txt")}>Download summary</Button>
          </div>
          <form className="mt-6 grid gap-3 border-t border-stone-200 pt-5 sm:grid-cols-2" onSubmit={(event) => {
            event.preventDefault(); addAppointment({ title: visitTitle.trim(), at: new Date(visitAt).toISOString() }); setSaved(true); setVisitTitle(""); setVisitAt("");
          }}>
            <div><Label htmlFor="visit-title">Appointment / planned visit</Label><Input id="visit-title" required value={visitTitle} onChange={(e) => setVisitTitle(e.target.value)} placeholder="Cornell Health visit" /></div>
            <div><Label htmlFor="visit-at">Date and time</Label><Input id="visit-at" required type="datetime-local" value={visitAt} onChange={(e) => setVisitAt(e.target.value)} /></div>
            <Button type="submit">Save appointment reminder</Button>
            <p role="status" className="text-sm text-stone-600">{saved ? "Reminder saved in My Health. " : ""}Book directly with the provider; this only saves your reminder.</p>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
