import { CareWorkflow } from "@/components/health/care-workflow";
import { AssistantBox } from "@/components/assistant/assistant-box";

export default function GetCarePage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Get care</h1>
        <p className="mt-2 max-w-2xl text-stone-600">
          Understand a reasonable level of care and prepare notes for a clinician. Resource listings
          link to official sources; check current hours before going.
        </p>
      </header>
      <div>
        <CareWorkflow />
      </div>
      <AssistantBox compact />
    </div>
  );
}
