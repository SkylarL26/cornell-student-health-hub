"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/field";
import { describeSleepSupport } from "@/lib/agents/sleep";
import { useHealth } from "@/lib/storage/health-store";
import type { EnergyLevel } from "@/lib/types/health";
import { formatDate } from "@/lib/utils";

export function WellnessWorkflow() {
  const { state, addSleepLog, addHydration } = useHealth();
  const [bedtime, setBedtime] = useState("01:30");
  const [wake, setWake] = useState("08:30");
  const [energy, setEnergy] = useState<EnergyLevel>(3);
  const [glasses, setGlasses] = useState(4);
  const [meals, setMeals] = useState("");
  const [saved, setSaved] = useState("");

  function durationHours() {
    const [bh, bm] = bedtime.split(":").map(Number);
    const [wh, wm] = wake.split(":").map(Number);
    let minutes = wh * 60 + wm - (bh * 60 + bm);
    if (minutes < 0) minutes += 24 * 60;
    return Math.round((minutes / 60) * 10) / 10;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Sleep & recovery</h2>
          <p className="mt-1 text-sm text-stone-600">
            Built for late nights and sick days, not as a fitness tracker.
          </p>
        </CardHeader>
        <CardBody>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const hours = durationHours();
              if (!Number.isFinite(hours) || hours <= 0) { setSaved("Enter different bedtime and wake times."); return; }
              setSaved("Sleep saved.");
              addSleepLog({
                date: new Date().toISOString().slice(0, 10),
                bedtime,
                wakeTime: wake,
                durationHours: hours,
                energy,
              });
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="bed">Bedtime</Label>
                <Input id="bed" required type="time" value={bedtime} onChange={(e) => setBedtime(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="wake">Wake time</Label>
                <Input id="wake" required type="time" value={wake} onChange={(e) => setWake(e.target.value)} />
              </div>
            </div>
            <p className="text-sm text-stone-600">Estimated duration: {durationHours()} hours</p>
            <div>
              <Label htmlFor="energy">Perceived energy (1–5)</Label>
              <Select
                id="energy"
                value={energy}
                onChange={(e) => setEnergy(Number(e.target.value) as EnergyLevel)}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            </div>
            <Button type="submit">Save last night</Button>
          </form>
        </CardBody>
      </Card>
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Hydration & meals</h2>
        </CardHeader>
        <CardBody>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              setSaved("Hydration and meals saved.");
              addHydration({
                at: new Date().toISOString(),
                glasses,
                meals,
              });
            }}
          >
            <div>
              <Label htmlFor="glasses">Glasses of fluid today</Label>
              <Input
                id="glasses"
                type="number"
                required max={100} min={0}
                value={glasses}
                onChange={(e) => setGlasses(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="meals">Meals (simple note)</Label>
              <Input id="meals" value={meals} onChange={(e) => setMeals(e.target.value)} />
            </div>
            <Button type="submit">Save</Button>
          </form>
          <p role="status" className="mt-3 text-sm text-green-800">{saved}</p>
          {state.hydration.at(-1) ? <p className="mt-3 text-sm">Latest entry: {state.hydration.at(-1)?.glasses} glasses · {state.hydration.at(-1)?.meals || "No meals noted"}</p> : null}
          <p className="mt-6 text-sm leading-relaxed text-stone-700">{describeSleepSupport(state)}</p>
          <ul className="mt-4 space-y-2 text-sm text-stone-600">
            {state.sleepHistory.slice(-4).map((log) => (
              <li key={log.id}>
                {formatDate(log.date)} · {log.durationHours}h · energy {log.energy}/5
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
