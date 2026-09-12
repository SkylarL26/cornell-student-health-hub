"use client";
import { inferIngredients } from "@/lib/safety/medications";
import { evaluateMedicationSafety } from "@/lib/agents/medication";
import { createId, localDateTime } from "@/lib/utils";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmergencyAlert } from "@/components/safety/emergency-alert";
import { RED_FLAG_CHECKLIST, redFlagsFromIds } from "@/lib/safety/red-flags";
import { buildSickDayPlan } from "@/lib/agents/sick-day";
import { recommendCareLevel } from "@/lib/safety/care-levels";
import { useHealth } from "@/lib/storage/health-store";
import {
  SYMPTOM_OPTIONS,
  type Severity,
  type SymptomName,
  type SymptomTrend,
} from "@/lib/types/health";
import { formatTime, hoursAgo } from "@/lib/utils";

export function SickDayWorkflow() {
  const { state, removeEntry, refreshPlan, applyMutations, togglePlanItem } =
    useHealth();
  const [name, setName] = useState<SymptomName>("sore_throat");
  const [customLabel, setCustomLabel] = useState("");
  const [severity, setSeverity] = useState<Severity>(3);
  const [trend, setTrend] = useState<SymptomTrend>("stable");
  const [startedAt, setStartedAt] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() - 12);
    return localDateTime(d);
  });
  const [temp, setTemp] = useState("");
  const [hydration, setHydration] = useState("some fluids");
  const [medsTaken, setMedsTaken] = useState("");
  const [medDose, setMedDose] = useState("");
  const [medTime, setMedTime] = useState(localDateTime);
  const [saved, setSaved] = useState(false);
  const [flags, setFlags] = useState<string[]>([]);

  const selectedFlags = redFlagsFromIds(flags);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const symptom = {
      id: createId("sx"), name, customLabel: name === "other" ? customLabel : undefined,
      severity, trend, startedAt: new Date(startedAt).toISOString(),
      notes: [hydration && `Hydration/food: ${hydration}`, medsTaken && `Already taken: ${medsTaken}`].filter(Boolean).join(" · "),
    };
    const temperatures = temp ? [{ id: createId("temp"), at: new Date().toISOString(), fahrenheit: Number(temp) }] : [];
    const next = { ...state, activeSymptoms: [...state.activeSymptoms.filter((s) => s.name !== name), symptom], temperatureHistory: [...state.temperatureHistory, ...temperatures] };
    const medications = medsTaken.trim() ? [{ id: createId("med"), name: medsTaken.trim(), dose: medDose.trim() || "Not provided", takenAt: new Date(medTime).toISOString(), activeIngredients: inferIngredients(medsTaken), source: "manual" as const }] : [];
    applyMutations({ symptoms: [symptom], temperatures, medications, sickDayPlan: buildSickDayPlan(next), careRecommendation: recommendCareLevel({ state: next, redFlags: selectedFlags }) });
    setSaved(true); setMedsTaken(""); setMedDose("");

  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Log how you feel</h2>
          <p className="mt-1 text-sm text-stone-600">
            This builds a sick-day plan. It will not tell you what disease you have.
          </p>
        </CardHeader>
        <CardBody>
          {selectedFlags.length > 0 ? <EmergencyAlert reasons={selectedFlags.map((f) => f.reason)} /> : null}
          <form className="mt-4 space-y-4" onSubmit={onSubmit}>
            <div>
              <Label htmlFor="symptom">Symptom</Label>
              <Select
                id="symptom"
                value={name}
                onChange={(e) => setName(e.target.value as SymptomName)}
              >
                {SYMPTOM_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
            {name === "other" ? (
              <div>
                <Label htmlFor="other">Describe it</Label>
                <Input required id="other" value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} />
              </div>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="started">When it started</Label>
                <Input
                  id="started"
                  type="datetime-local"
                  required
                  value={startedAt}
                  onChange={(e) => setStartedAt(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="severity">Severity (1–5)</Label>
                <Select
                  id="severity"
                  value={severity}
                  onChange={(e) => setSeverity(Number(e.target.value) as Severity)}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="trend">Trend</Label>
                <Select
                  id="trend"
                  value={trend}
                  onChange={(e) => setTrend(e.target.value as SymptomTrend)}
                >
                  <option value="improving">Improving</option>
                  <option value="stable">Stable</option>
                  <option value="worsening">Worsening</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="temp">Temperature °F (optional)</Label>
                <Input
                  id="temp"
                  type="number" min="90" max="115" step="0.1"
                  inputMode="decimal"
                  placeholder="101.2"
                  value={temp}
                  onChange={(e) => setTemp(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="hydration">Hydration / food intake</Label>
              <Input
                id="hydration"
                value={hydration}
                onChange={(e) => setHydration(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="already">Medication already taken (one product)</Label>
              <Textarea
                id="already"
                className="min-h-20"
                value={medsTaken}
                onChange={(e) => setMedsTaken(e.target.value)}
                placeholder="e.g. DayQuil — saved to your medication timeline"
              />
            </div>
            {medsTaken.trim() ? <div className="space-y-3 rounded-xl bg-amber-50 p-3">
              <div><Label htmlFor="sick-dose">Dose taken, if known</Label><Input id="sick-dose" value={medDose} onChange={(e) => setMedDose(e.target.value)} /></div>
              <div><Label htmlFor="sick-med-time">Time taken</Label><Input id="sick-med-time" required type="datetime-local" value={medTime} onChange={(e) => setMedTime(e.target.value)} /></div>
              <p className="text-xs">Ingredients are estimated from the product name; verify your label. Use Medications to log additional products.</p>
              {evaluateMedicationSafety(state, medsTaken).map((w) => <p key={w.ingredient} role="alert" className="text-sm font-medium">{w.message}</p>)}
            </div> : null}
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-stone-700">
                Emergency warning signs (check any that apply)
              </legend>
              <div className="space-y-2 rounded-xl bg-stone-50 p-3">
                {RED_FLAG_CHECKLIST.map((item) => (
                  <label key={item.id} className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={flags.includes(item.id)}
                      onChange={(e) => {
                        setFlags((current) =>
                          e.target.checked
                            ? [...current, item.id]
                            : current.filter((id) => id !== item.id),
                        );
                      }}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <Button type="submit">Save symptoms & update plan</Button>
            {saved ? <p role="status" className="text-sm text-green-800">Saved. Your plan and appointment notes are updated.</p> : null}
          </form>
        </CardBody>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Current symptoms</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            {state.activeSymptoms.length === 0 ? (
              <p className="text-sm text-stone-500">Nothing logged yet.</p>
            ) : (
              state.activeSymptoms.map((symptom) => (
                <div key={symptom.id} className="rounded-xl border border-stone-100 bg-stone-50 p-3">
                  <p className="font-medium capitalize">
                    {symptom.name.replace("_", " ")}
                    {symptom.customLabel ? ` — ${symptom.customLabel}` : ""}
                  </p>
                  <p className="text-sm text-stone-600">
                    Severity {symptom.severity === null ? "not provided" : `${symptom.severity}/5`} · {symptom.trend} · started{" "}
                    {formatTime(symptom.startedAt)} (
                    {Math.max(1, Math.round(hoursAgo(symptom.startedAt)))}h)
                  </p>
                  {symptom.notes ? <p className="mt-2 text-xs text-stone-600">{symptom.notes}</p> : null}
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeEntry("activeSymptoms", symptom.id)}>Mark resolved</Button>
                </div>
              ))
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">Today&apos;s sick-day plan</h2>
              <p className="text-sm text-stone-600">Conservative, generic actions — not treatment orders.</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                if (!state.sickDayPlan) refreshPlan();
                else applyMutations({ sickDayPlan: buildSickDayPlan(state) });
              }}
            >
              Refresh plan
            </Button>
          </CardHeader>
          <CardBody className="space-y-2">
            {!state.sickDayPlan ? (
              <p className="text-sm text-stone-500">Add a symptom or tap refresh to generate a plan.</p>
            ) : (
              state.sickDayPlan.items.map((item) => (
                <label key={item.id} className="flex items-start gap-2 rounded-xl border border-stone-100 p-3 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={item.done}
                    onChange={() => togglePlanItem(item.id)}
                  />
                  <span>
                    <span className="font-medium capitalize">{item.category.replace("_", " ")}: </span>
                    {item.text}
                  </span>
                </label>
              ))
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
