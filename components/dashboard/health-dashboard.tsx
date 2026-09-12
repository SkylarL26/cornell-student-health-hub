"use client";

import { useState } from "react";
import { Input, Label, Select } from "@/components/ui/field";
import type { HealthTaskKind } from "@/lib/types/health";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CARE_LEVEL_COPY } from "@/lib/safety/care-levels";
import { useHealth } from "@/lib/storage/health-store";
import { symptomLabel } from "@/lib/types/health";
import { averageSleepHours } from "@/lib/agents/sleep";
import { formatTime } from "@/lib/utils";

function Bar({ value, max }: { value: number; max: number }) {
  const width = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-stone-100">
      <div className="h-full rounded-full bg-[var(--cornell-red)]" style={{ width: `${width}%` }} />
    </div>
  );
}

export function HealthDashboard() {
  const { state, ready, resetState, loadDemo, toggleTask, togglePlanItem, addTask, removeEntry } = useHealth();
  const [taskTitle, setTaskTitle] = useState("");
  const [taskKind, setTaskKind] = useState<HealthTaskKind>("follow_up");
  if (!ready) {
    return <p className="text-sm text-stone-500">Loading your session…</p>;
  }

  const lastSleep = state.sleepHistory.at(-1);
  const avg = averageSleepHours(state.sleepHistory);
  const temps = state.temperatureHistory.slice(-6);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">My Health</h1>
          <p className="mt-1 text-sm text-stone-600">
            Your symptoms, recovery plan, and next steps in one place. Saved in this browser until you clear them.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => { if (window.confirm("Replace saved health notes with demo data?")) loadDemo(); }}>
            Load demo data
          </Button>
          <Button variant="ghost" onClick={() => { if (window.confirm("Clear all health notes saved in this browser?")) resetState(); }}>
            Clear session
          </Button>
        </div>
      </div>

      <section aria-label="Health at a glance" className="grid grid-cols-2 gap-4 rounded-3xl bg-stone-900 p-6 text-white sm:grid-cols-4">
        <div><p className="text-xs uppercase tracking-wider text-stone-300">Symptoms tracked</p><p className="mt-2 text-3xl font-semibold">{state.activeSymptoms.length}</p></div>
        <div><p className="text-xs uppercase tracking-wider text-stone-300">Plan progress</p><p className="mt-2 text-3xl font-semibold">{state.sickDayPlan ? `${state.sickDayPlan.items.filter(i => i.done).length}/${state.sickDayPlan.items.length}` : "—"}</p></div>
        <div><p className="text-xs uppercase tracking-wider text-stone-300">Latest sleep</p><p className="mt-2 text-3xl font-semibold">{lastSleep ? `${lastSleep.durationHours}h` : "—"}</p></div>
        <div><p className="text-xs uppercase tracking-wider text-stone-300">Open health tasks</p><p className="mt-2 text-3xl font-semibold">{state.healthTasks.filter(t => !t.done).length}</p></div>
      </section>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Current symptoms</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            {state.activeSymptoms.length === 0 ? (
              <p className="text-sm text-stone-500">
                None logged. <Link className="underline" href="/sick">I&apos;m feeling sick</Link>
              </p>
            ) : (
              state.activeSymptoms.map((s) => (
                <div key={s.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium">{symptomLabel(s.name, s.customLabel)}</span>
                    <Badge tone={s.trend === "worsening" ? "red" : s.trend === "improving" ? "green" : "neutral"}>
                      {s.trend}
                    </Badge>
                  </div>
                  {s.severity !== null ? <Bar value={s.severity} max={5} /> : null}
                  <p className="mt-1 text-xs text-stone-500">
                    Severity {s.severity === null ? "not provided" : `${s.severity}/5`} · since {formatTime(s.startedAt)}
                  </p>
                </div>
              ))
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold">Medication timeline</h2>
          </CardHeader>
          <CardBody>
            {state.medications.length === 0 ? (
              <p className="text-sm text-stone-500">
                Empty. <Link className="underline" href="/medications">Add a product</Link>
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {[...state.medications].sort((a,b) => Date.parse(a.takenAt) - Date.parse(b.takenAt)).slice(-5).map((med) => (
                  <li key={med.id}>
                    <span className="font-medium">{med.name}</span> {med.dose}
                    <span className="block text-xs text-stone-500">{formatTime(med.takenAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card className="border-red-200 bg-red-50/30">
          <CardHeader>
            <h2 className="font-semibold">Today&apos;s plan</h2>
          </CardHeader>
          <CardBody>
            {!state.sickDayPlan ? (
              <p className="text-sm text-stone-500">Generate a plan from the sick-day page.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {state.sickDayPlan.items.slice(0, 5).map((item) => (
                  <li key={item.id} className={item.done ? "text-stone-400 line-through" : ""}>
                    <label className="flex items-start gap-2"><input type="checkbox" checked={item.done} onChange={() => togglePlanItem(item.id)} />{item.text}</label>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold">Sleep</h2>
          </CardHeader>
          <CardBody>
            {lastSleep ? (
              <>
                <p className="text-3xl font-semibold">{lastSleep.durationHours}h</p>
                <p className="text-sm text-stone-600">Last night · energy {lastSleep.energy}/5</p>
                {avg ? (
                  <p className="mt-2 text-xs text-stone-500">Recent average {avg.toFixed(1)}h</p>
                ) : null}
                <div className="mt-3 flex items-end gap-1">
                  {state.sleepHistory.slice(-7).map((log) => (
                    <div
                      key={log.id}
                      className="w-6 rounded-t bg-[var(--cornell-red)]/80"
                      style={{ height: `${Math.min(64, log.durationHours * 7)}px` }}
                      title={`${log.durationHours}h`}
                    />
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-stone-500">
                No sleep logs. <Link className="underline" href="/wellness">Add last night</Link>
              </p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold">Upcoming academic obligations</h2>
          </CardHeader>
          <CardBody>
            {state.academicObligations.length === 0 ? (
              <p className="text-sm text-stone-500">
                None. <Link className="underline" href="/classes">Add a prelim or class</Link>
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {state.academicObligations.map((item) => (
                  <li key={item.id}>
                    <span className="font-medium">
                      {item.course} {item.title}
                    </span>
                    <span className="block text-xs text-stone-500">{formatTime(item.startsAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold">Health tasks</h2>
          </CardHeader>
          <CardBody>
            {state.lastCareRecommendation ? (
              <p className="mb-3 text-xs text-stone-500">
                Last care suggestion: {CARE_LEVEL_COPY[state.lastCareRecommendation.level].title}
              </p>
            ) : null}
            {state.healthTasks.length === 0 && state.upcomingAppointments.length === 0 ? (
              <p className="text-sm text-stone-500">No follow-ups yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {state.upcomingAppointments.map((apt) => (
                  <li key={apt.id}>
                    Appointment: {apt.title} · {formatTime(apt.at)}
                    <Button variant="ghost" size="sm" onClick={() => removeEntry("upcomingAppointments", apt.id)}>Remove</Button>
                  </li>
                ))}
                {state.healthTasks.map((task) => (
                  <li key={task.id}>
                    <label className="flex gap-2">
                      <input type="checkbox" checked={task.done} onChange={() => toggleTask(task.id)} />
                      {task.title}
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <Card><CardBody className="pt-5"><form className="flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); if (taskTitle.trim()) { addTask({ title: taskTitle.trim(), kind: taskKind, done: false }); setTaskTitle(""); } }}>
        <div className="min-w-48 flex-1"><Label htmlFor="task-title">Add a health task</Label><Input id="task-title" required value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Refill a prescription or arrange a follow-up" /></div>
        <div><Label htmlFor="task-kind">Type</Label><Select id="task-kind" value={taskKind} onChange={(e) => setTaskKind(e.target.value as HealthTaskKind)}><option value="follow_up">Follow-up</option><option value="refill">Refill</option><option value="appointment">Appointment</option><option value="other">Other</option></Select></div><Button type="submit">Add task</Button>
      </form></CardBody></Card>
      {temps.length > 0 ? (
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Temperature log</h2>
          </CardHeader>
          <CardBody>
            <div className="flex items-end gap-3">
              {temps.map((t) => (
                <div key={t.id} className="text-center">
                  <div
                    className="mx-auto w-8 rounded-t-lg bg-red-800/80"
                    style={{ height: `${Math.max(16, (t.fahrenheit - 97) * 18)}px` }}
                  />
                  <p className="mt-1 text-xs font-medium">{t.fahrenheit}°</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
