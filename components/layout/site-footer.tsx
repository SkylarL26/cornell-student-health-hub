import { SHORT_SAFETY_LINE } from "@/lib/safety/disclaimers";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-stone-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-stone-600">
        <p className="font-medium text-stone-800">Not medical care</p>
        <p className="mt-1 max-w-3xl leading-relaxed">{SHORT_SAFETY_LINE}</p>
        <p className="mt-3 text-xs text-stone-500">
          If this is an emergency, call 911. For mental health crisis support in the U.S., call or
          text 988.
        </p>
      </div>
    </footer>
  );
}
