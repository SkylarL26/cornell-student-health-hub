"use client";
import { useState } from "react";
import { Button } from "./button";
export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [status, setStatus] = useState("");
  return <span className="inline-flex flex-wrap items-center gap-2"><Button type="button" onClick={async () => {
    try { await navigator.clipboard.writeText(text); setStatus("Copied"); }
    catch { setStatus("Copy unavailable. Select the text or download it."); }
    window.setTimeout(() => setStatus(""), 3000);
  }}>{label}</Button><span role="status" className="text-xs text-stone-600">{status}</span></span>;
}
