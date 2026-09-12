"use client";
import { localDateTime } from "@/lib/utils";

import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/field";
import {
  evaluateMedicationSafety,
} from "@/lib/agents/medication";
import { COMMON_OTC_MEDICATIONS, inferIngredients } from "@/lib/safety/medications";
import { useHealth } from "@/lib/storage/health-store";
import { formatTime } from "@/lib/utils";

export function MedicationWorkflow() {
  const { state, addMedication, removeEntry } = useHealth();
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [takenAt, setTakenAt] = useState(() => localDateTime());
  const [ingredients, setIngredients] = useState("");
  const [note, setNote] = useState("");
  const [imageNote, setImageNote] = useState(false);

  const previewIngredients = inferIngredients(
    name,
    ingredients
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean),
  );
  const warnings = useMemo(
    () => (name ? evaluateMedicationSafety(state, name, previewIngredients) : []),
    [name, previewIngredients, state],
  );

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    addMedication({
      name: name.trim(),
      dose: dose.trim() || "see label",
      takenAt: new Date(takenAt).toISOString(),
      activeIngredients: previewIngredients,
      source: imageNote ? "label_image" : "manual",
      notes: note || undefined,
    });
    setName("");
    setDose("");
    setIngredients("");
    setNote("");
    setImageNote(false);
  }

  const sorted = [...state.medications].sort(
    (a, b) => +new Date(a.takenAt) - +new Date(b.takenAt),
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Log a medication</h2>
          <p className="mt-1 text-sm text-stone-600">
            Duplicate active-ingredient checks use a small OTC catalog. This is not a drug-interaction
            database and does not recommend doses.
          </p>
        </CardHeader>
        <CardBody>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <Label htmlFor="med-name">Medication name</Label>
              <Input
                id="med-name"
                list="otc-list"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="DayQuil, Tylenol, ibuprofen…"
                required
              />
              <datalist id="otc-list">
                {COMMON_OTC_MEDICATIONS.map((med) => (
                  <option key={med.names[0]} value={med.names[0]} />
                ))}
              </datalist>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="dose">Dose on the label</Label>
                <Input
                  id="dose"
                  value={dose}
                  onChange={(e) => setDose(e.target.value)}
                  placeholder="e.g. 500 mg — do not invent this"
                />
              </div>
              <div>
                <Label htmlFor="when">Time taken</Label>
                <Input
                  id="when"
                  type="datetime-local"
                  required
                  value={takenAt}
                  onChange={(e) => setTakenAt(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="ingredients">Active ingredients if known (comma-separated)</Label>
              <Input
                id="ingredients"
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                placeholder="acetaminophen, dextromethorphan"
              />
              {previewIngredients.length > 0 ? (
                <p className="mt-1 text-xs text-stone-500">
                  Possible ingredients (formulations vary; verify the exact label): {previewIngredients.join(", ")}
                </p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="med-note">Optional note</Label>
              <Textarea id="med-note" className="min-h-16" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm text-stone-600">
              <input type="checkbox" checked={imageNote} onChange={(e) => setImageNote(e.target.checked)} />
              I read this from a label photo (image recognition is not enabled in this MVP)
            </label>
            {warnings.length > 0 ? (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
                <p className="font-semibold">Possible duplicate active ingredient</p>
                {warnings.map((warning) => (
                  <p key={warning.ingredient} className="mt-2">
                    <strong className="capitalize">{warning.ingredient}</strong> may appear in{" "}
                    {warning.medications.join(" and ")}. {warning.message}
                  </p>
                ))}
              </div>
            ) : null}
            <p className="text-xs text-stone-600">A missing warning does not establish safety. Verify unknown products or combinations with a pharmacist. Checks compare your entire logged history, not a safe dosing interval.</p>
            <Button type="submit">Add to timeline</Button>
          </form>
        </CardBody>
      </Card>
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Medication timeline</h2>
        </CardHeader>
        <CardBody>
          {sorted.length === 0 ? (
            <p className="text-sm text-stone-500">No medications logged yet. Add a product to keep its dose, time, and ingredients together.</p>
          ) : (
            <ol className="relative space-y-4 border-l border-stone-200 pl-5">
              {sorted.map((med) => (
                <li key={med.id}>
                  <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-[var(--cornell-red)]" />
                  <p className="font-medium">{med.name}</p>
                  <p className="text-sm text-stone-600">
                    {med.dose} · {formatTime(med.takenAt)}
                  </p>
                  {med.activeIngredients.length > 0 ? (
                    <p className="text-xs text-stone-500">
                      Possible / entered ingredients: {med.activeIngredients.join(", ")}
                    </p>
                  ) : (
                    <p className="text-xs text-stone-500">Ingredients unknown — check the label.</p>
                  )}
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeEntry("medications", med.id)}>Remove entry</Button>
                </li>
              ))}
            </ol>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
