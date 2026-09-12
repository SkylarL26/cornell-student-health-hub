import { ClassesWorkflow } from "@/components/health/classes-workflow";
import { AssistantBox } from "@/components/assistant/assistant-box";

export default function ClassesPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Health & classes</h1>
        <p className="mt-2 max-w-2xl text-stone-600">
          Keep track of labs, prelims, and assignments, then draft a notification. Messages are never
          sent automatically.
        </p>
      </header>
      <ClassesWorkflow />
      <AssistantBox compact />
    </div>
  );
}
