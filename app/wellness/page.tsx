import { WellnessWorkflow } from "@/components/wellness/wellness-workflow";
import { AssistantBox } from "@/components/assistant/assistant-box";

export default function WellnessPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Sleep & wellness</h1>
        <p className="mt-2 max-w-2xl text-stone-600">
          Practical recovery notes for college schedules. Not a sleep-medicine assessment.
        </p>
      </header>
      <WellnessWorkflow />
      <AssistantBox compact />
    </div>
  );
}
