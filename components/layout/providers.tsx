"use client";

import { HealthProvider } from "@/lib/storage/health-store";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return <HealthProvider>{children}</HealthProvider>;
}
