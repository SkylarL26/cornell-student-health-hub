import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function createId(prefix = "id"): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function hoursAgo(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 36e5;
}

export function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export function localDateTime(date = new Date()): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function downloadText(text: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename; anchor.click();
  URL.revokeObjectURL(url);
}

/** Convert a wall-clock hour using the browser's UTC offset, never the server timezone. */
export function relativeLocalHour(hour: number, dayOffset: number, timezoneOffset: number, now = new Date()): string {
  const local = new Date(now.getTime() - timezoneOffset * 60000);
  local.setUTCDate(local.getUTCDate() + dayOffset);
  local.setUTCHours(hour, 0, 0, 0);
  return new Date(local.getTime() + timezoneOffset * 60000).toISOString();
}
