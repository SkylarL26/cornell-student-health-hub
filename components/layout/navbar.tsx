"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeartPulse, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { PROTOTYPE_DISCLAIMER } from "@/lib/safety/disclaimers";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/my-health", label: "My Health" },
  { href: "/get-care", label: "Get Care" },
  { href: "/medications", label: "Medications" },
  { href: "/wellness", label: "Wellness" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-[rgba(252,250,247,0.9)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold text-stone-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--cornell-red)] text-white">
            <HeartPulse className="h-5 w-5" aria-hidden />
          </span>
          <span className="leading-tight">
            Cornell Student Health Hub
            <span className="block text-[11px] font-normal text-stone-500">
              Independent student prototype
            </span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-stone-900 text-white"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          className="rounded-lg p-2 md:hidden"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open ? (
        <nav className="border-t border-stone-200 px-4 py-3 md:hidden" aria-label="Mobile">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm text-stone-700 hover:bg-stone-100"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      ) : null}
      <p className="border-t border-stone-200/80 bg-[#f6efe8] px-4 py-1.5 text-center text-[11px] text-stone-600">
        {PROTOTYPE_DISCLAIMER}
      </p>
    </header>
  );
}
