import Link from "next/link";
import {
  BedDouble,
  ClipboardList,
  GraduationCap,
  Hospital,
  Pill,
  Thermometer,
} from "lucide-react";
import { AssistantBox } from "@/components/assistant/assistant-box";
import { LONG_SAFETY_COPY } from "@/lib/safety/disclaimers";

const CARDS = [
  {
    href: "/sick",
    title: "I'm Feeling Sick",
    body: "Log symptoms and get a conservative sick-day plan.",
    icon: Thermometer,
  },
  {
    href: "/medications",
    title: "Medication Safety",
    body: "Track OTC products and catch duplicate ingredients like acetaminophen.",
    icon: Pill,
  },
  {
    href: "/get-care",
    title: "Where Should I Get Care?",
    body: "Sort self-care vs campus, urgent, or emergency — without a diagnosis.",
    icon: Hospital,
  },
  {
    href: "/wellness",
    title: "Sleep & Wellness",
    body: "Log sleep, fluids, and simple meals after a rough night.",
    icon: BedDouble,
  },
  {
    href: "/get-care#appointment",
    title: "Prepare for an Appointment",
    body: "Turn your notes into a clinician-ready summary you can copy.",
    icon: ClipboardList,
  },
  {
    href: "/classes",
    title: "Health & Classes",
    body: "Track prelims and draft a professor message. Nothing is sent.",
    icon: GraduationCap,
  },
];

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-[2rem] border border-stone-200 bg-[linear-gradient(160deg,#fff 0%,#f8efe8 45%,#f3e4dc 100%)] px-6 py-10 sm:px-10">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--cornell-red)]">
          For Cornell students
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
          What do you need help with today?
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-stone-600">
          A single health companion for sick days, medications, care navigation, sleep, and the
          academic logistics of being unwell — without replacing professional medical care.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="group rounded-3xl border border-stone-200 bg-white p-5 shadow-[0_12px_40px_-28px_rgba(80,20,20,0.55)] transition hover:-translate-y-0.5 hover:border-[var(--cornell-red)]/30"
          >
            <card.icon aria-hidden="true" className="h-5 w-5 text-stone-400 group-hover:text-[var(--cornell-red)]" />
            <h2 className="mt-4 text-lg font-semibold text-stone-900">{card.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">{card.body}</p>
          </Link>
        ))}
      </section>

      <section>
        <AssistantBox />
      </section>

      <p className="text-xs leading-relaxed text-stone-500">{LONG_SAFETY_COPY}</p>
    </div>
  );
}
