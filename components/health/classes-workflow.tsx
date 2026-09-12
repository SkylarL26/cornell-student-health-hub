"use client";
import { CopyButton } from "@/components/ui/copy-button";
import { localDateTime } from "@/lib/utils";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { draftProfessorMessage, upcomingSoon } from "@/lib/agents/academic";
import { useHealth } from "@/lib/storage/health-store";
import type { ObligationType } from "@/lib/types/health";
import { formatTime } from "@/lib/utils";

export function ClassesWorkflow() {
  const { state, addObligation, removeEntry } = useHealth();
  const [title, setTitle] = useState("Chemistry prelim");
  const [course, setCourse] = useState("CHEM 2070");
  const [type, setType] = useState<ObligationType>("exam");
  const [startsAt, setStartsAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return localDateTime(d);
  });
  const [editedDraft, setEditedDraft] = useState<string | null>(null);

  const draft = useMemo(
    () =>
      draftProfessorMessage(
        state,
        upcomingSoon(state.academicObligations, 168)[0] ?? state.academicObligations[0],
      ),
    [state],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Upcoming academic obligations</h2>
          <p className="mt-1 text-sm text-stone-600">
            For when being sick collides with class, lab, or a prelim. Nothing is emailed for you.
          </p>
        </CardHeader>
        <CardBody>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              addObligation({
                title,
                course,
                type,
                startsAt: new Date(startsAt).toISOString(),
              });
            }}
          >
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="course">Course</Label>
                <Input id="course" value={course} onChange={(e) => setCourse(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value as ObligationType)}
                >
                  <option value="class">Class</option>
                  <option value="lab">Lab</option>
                  <option value="exam">Exam / prelim</option>
                  <option value="assignment">Assignment</option>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="when">When</Label>
              <Input
                id="when"
                type="datetime-local"
                  required
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>
            <Button type="submit">Add obligation</Button>
          </form>
          <ul className="mt-6 space-y-2 text-sm">
            {state.academicObligations.length === 0 ? (
              <li className="text-stone-500">None yet.</li>
            ) : (
              state.academicObligations.map((item) => (
                <li key={item.id} className="rounded-xl bg-stone-50 p-3">
                  <span className="font-medium">{item.course} {item.title}</span>
                  <span className="block text-stone-600">
                    {item.type} · {formatTime(item.startsAt)}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => removeEntry("academicObligations", item.id)}>Remove</Button>
                </li>
              ))
            )}
          </ul>
        </CardBody>
      </Card>
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Draft message to professor</h2>
          <p className="mt-1 text-sm text-stone-600">
            Edit before you send. This prototype never transmits messages.
          </p>
        </CardHeader>
        <CardBody>
          <Textarea aria-label="Professor message draft" className="min-h-72 font-sans" value={editedDraft ?? draft} onChange={(e) => setEditedDraft(e.target.value)} />
          <div className="mt-3"><CopyButton text={editedDraft ?? draft} label="Copy draft" /> <Button variant="ghost" onClick={() => setEditedDraft(null)}>Regenerate</Button></div>
        </CardBody>
      </Card>
    </div>
  );
}
