import { SickDayWorkflow } from "@/components/health/sick-day-workflow";
import { AssistantBox } from "@/components/assistant/assistant-box";

export default function SickPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">I&apos;m feeling sick</h1>
        <p className="mt-2 max-w-2xl text-stone-600">
          Organize symptoms, warning-sign checks, and a simple plan. This workflow does not diagnose
          conditions.
        </p>
      </header>
      <SickDayWorkflow />
      <AssistantBox compact />
    </div>
  );
}
