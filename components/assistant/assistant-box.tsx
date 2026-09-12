"use client";

import { useState } from "react";
import Link from "next/link";
import { detectRedFlags } from "@/lib/safety/red-flags";
import { CopyButton } from "@/components/ui/copy-button";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { EmergencyAlert } from "@/components/safety/emergency-alert";
import { useHealth } from "@/lib/storage/health-store";
import type { AssistantResponse, IntentCategory } from "@/lib/types/health";

const INTENT_LABEL: Record<IntentCategory, string> = {
  SYMPTOMS: "Sick day",
  MEDICATION: "Medication",
  CARE_NAVIGATION: "Get care",
  SLEEP: "Sleep",
  APPOINTMENT_PREP: "Appointment prep",
  ACADEMIC_SUPPORT: "Classes",
};

const DEMO =
  "I've had a sore throat and fever since yesterday. I took DayQuil around noon and I have a chemistry prelim tomorrow morning.";

export function AssistantBox({ compact = false }: { compact?: boolean }) {
  const { state, applyMutations, messages, addMessage } = useHealth();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const immediateFlags = detectRedFlags(input);
  const [last, setLast] = useState<AssistantResponse | null>(null);

  async function submit(text: string) {
    const message = text.trim();
    if (!message || loading) return;
    setLoading(true);
    setError(null);
    addMessage({ role: "user", content: message });
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          timezoneOffset: new Date().getTimezoneOffset(),
          state,
          conversation: messages.slice(-8).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      if (!response.ok) throw new Error("Assistant request failed");
      const data = (await response.json()) as AssistantResponse;
      setLast(data);
      applyMutations(data.mutations);
      addMessage({
        role: "assistant",
        content: data.reply,
        intents: data.intents,
        emergency: data.emergency,
      });
      setInput("");
    } catch {
      setError("The assistant is unavailable right now. You can still use the forms on each page.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {immediateFlags.length > 0 ? <EmergencyAlert reasons={immediateFlags.map((f) => f.reason)} /> : null}
      <form
        className="rounded-3xl border border-stone-200 bg-white p-4 shadow-[0_20px_50px_-30px_rgba(120,20,20,0.45)]"
        onSubmit={(event) => {
          event.preventDefault();
          void submit(input);
        }}
      >
        <label htmlFor="assistant-input" className="mb-2 flex items-center gap-2 text-sm font-medium text-stone-700">
          <Sparkles className="h-4 w-4 text-[var(--cornell-red)]" />
          Describe what is going on — one message can cover several needs
        </label>
        <Textarea
          id="assistant-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder='Try: "I have a sore throat, took DayQuil, and have a prelim tomorrow."'
          className="min-h-24"
        />
        <p className="mt-2 text-xs text-stone-500">Submitting sends your message and saved health notes to this app’s server, and to OpenAI if configured. Forms work locally without AI.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={loading || !input.trim()}>
            {loading ? "Routing your request…" : "Get coordinated help"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => setInput(DEMO)}>
            Load demo scenario
          </Button>
        </div>
      </form>

      {error ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {error}
        </p>
      ) : null}

      {last?.emergency ? <EmergencyAlert reasons={last.emergencyReasons} /> : null}

      {last ? (
        <div aria-live="polite" className="space-y-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">
          <div className="flex flex-wrap gap-1.5">
            {last.intents.map((intent) => (
              <Badge key={intent} tone="red">
                {INTENT_LABEL[intent]}
              </Badge>
            ))}
            <Badge tone={last.usedAi ? "green" : "neutral"}>
              {last.usedAi ? "AI-assisted" : "Demo / rules engine"}
            </Badge>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-800">{last.reply}</p>
          {last.followUpQuestions.length > 0 ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Only if you know
              </p>
              <ul className="mt-1 space-y-1 text-sm text-stone-700">
                {last.followUpQuestions.map((q) => (
                  <li key={q}>
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-3 text-sm font-medium text-red-800"><Link href="/sick">Review symptoms & plan →</Link><Link href="/medications">Confirm medication details →</Link><Link href="/get-care#appointment">Prepare appointment summary →</Link></div>
          {last.professorDraft ? (
            <details className="rounded-xl bg-white p-3 text-sm">
              <summary className="cursor-pointer font-medium">Draft professor message (not sent)</summary>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-sans text-stone-700">
                {last.professorDraft}
              </pre>
              <CopyButton text={last.professorDraft} label="Copy draft" />
            </details>
          ) : null}
        </div>
      ) : null}

      {!compact && messages.length > 0 ? (
        <ol className="space-y-2" aria-live="polite">
          {messages.slice(-6).map((msg) => (
            <li
              key={msg.id}
              className={
                msg.role === "user"
                  ? "ml-8 rounded-2xl bg-[var(--cornell-red)] px-4 py-2 text-sm text-white"
                  : "mr-8 rounded-2xl bg-white px-4 py-2 text-sm text-stone-800 shadow-sm"
              }
            >
              {msg.content}
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
