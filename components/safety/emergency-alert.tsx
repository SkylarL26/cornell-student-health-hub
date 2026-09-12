import { AlertTriangle, Phone } from "lucide-react";
import { EMERGENCY_BANNER } from "@/lib/safety/disclaimers";

export function EmergencyAlert({ reasons }: { reasons?: string[] }) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-red-300 bg-red-50 p-4 text-red-950 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <div>
          <p className="font-semibold">{EMERGENCY_BANNER}</p>
          {reasons && reasons.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          ) : null}
          <a
            href="tel:911"
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-red-700 px-3 py-2 text-sm font-medium text-white"
          >
            <Phone className="h-4 w-4" /> Call 911
          </a>
        </div>
      </div>
    </div>
  );
}
