import { MedicationWorkflow } from "@/components/medications/medication-workflow";
import { AssistantBox } from "@/components/assistant/assistant-box";

export default function MedicationsPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Medication safety</h1>
        <p className="mt-2 max-w-2xl text-stone-600">
          Track what you took and watch for overlapping OTC ingredients. We will not invent
          interactions, doses, or contraindications.
        </p>
      </header>
      <MedicationWorkflow />
      <AssistantBox compact />
    </div>
  );
}
