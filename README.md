# Cornell Student Health Hub

Student-built prototype of an AI-powered health companion for Cornell University students. It helps organize sick days, over-the-counter medications, care navigation, appointment notes, sleep, and class logistics.

**This is not an official Cornell University or Cornell Health product.** It does not diagnose disease, does not replace a physician, nurse, pharmacist, or other professional, and should never delay emergency care. If you have emergency warning signs, call **911**.

## Setup

```bash
cd cornell-student-health-hub
npm install
cp .env.example .env.local   # optional
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | No | Server-side natural-language routing and reply rewriting |
| `OPENAI_MODEL` | No | Defaults to `gpt-4o-mini` |

If no API key is set, a deterministic rules engine still runs the demo scenario and all workflows.

Never put the API key in client code. All model calls go through `app/api/assistant/route.ts`.

## Architecture

- **Shared `StudentHealthState`** lives in React context and `localStorage` (`lib/storage`). Agents read and write the same session object. Auth and a production database can be added later without changing the type shape.
- **Deterministic safety** is isolated in `lib/safety` (red flags, OTC ingredient catalog, care-level rules, disclaimers). Emergency detection and duplicate-ingredient warnings do not depend on an LLM.
- **Orchestrator** (`lib/ai/orchestrator.ts`): user text → intent router (OpenAI or heuristics) → specialized workflows → one coordinated reply, plus structured mutations applied on the client.
- **Configurable campus resources** live in `lib/resources/care-resources.ts`. Do not treat hours or policies as live data.

Suggested layout:

```
app/                 pages + API
components/          UI, dashboard, health, medications, wellness
lib/agents/          sick day, meds, care, appointment, sleep, classes
lib/ai/              router, OpenAI client, orchestrator
lib/safety/          red flags, medications, care levels, copy
lib/storage/         session state
lib/types/           StudentHealthState
```

## Demo scenario

On the homepage, choose **Load demo scenario** or paste:

> I've had a sore throat and fever since yesterday. I took DayQuil around noon and I have a chemistry prelim tomorrow morning.

The hub should identify symptom, medication, and academic needs; screen warning signs; log illness and DayQuil; build a sick-day plan; discuss care level; acknowledge the prelim; and offer a professor draft. Later, logging Tylenol should warn about overlapping acetaminophen. Use **Get Care** to copy a clinician-ready summary.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Working with saved notes

- The sick-day form adds or updates a symptom, logs an optional medication directly in the shared timeline, and refreshes care guidance and the recovery plan together. Mark a symptom resolved when it ends; recorded history remains available.
- Medication questions run ingredient checks without claiming a product was taken. Only an explicit report of taking a recognized medication creates an assistant timeline entry. Review estimated times and ingredients in Medications; remove an incorrect entry and log the corrected details.
- My Health supports task creation, task/plan completion, appointment reminders, and clearing browser data. Loading demo data replaces existing notes after confirmation.
- Get Care includes actual appointment date/time reminders, explicitly reported important negatives, and copy/download of appointment notes. It does not book appointments. Professor drafts are editable and never sent.

## Validation

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The Node test runner uses the installed TypeScript compiler in memory; no additional test dependencies or API credentials are needed. Regression cases cover the combined demo, duplicate ingredients within and across messages, questions versus doses taken, negation, immediate emergency escalation, timezone handling, decimal temperatures, invalid API input, and chronological appointment notes.

The build script uses Next.js's supported webpack option because Turbopack's CSS worker could not bind its internal port in the development sandbox. Fonts use the system sans-serif stack, so builds do not require downloading Google Fonts.

## Privacy and limitations

Browser storage persists across visits and is not encrypted. Do not use this prototype as a clinical record or on a shared device with real sensitive information. Clear saved notes from My Health. Storage corruption is rejected; if browser storage is disabled, the current in-memory session remains usable but will not survive reloads.

Submitting an assistant request sends the message and current state to the app server. If an API key is configured, the message and generated context are also processed by OpenAI. Forms do not require AI. The app has no authentication or production database. Add authentication, request throttling, clinical review, and an appropriate privacy/retention design before any public medical deployment.

The deterministic router is intentionally limited. Confirm extracted records using the forms: unknown severity and trend stay unknown, onset may be approximate, and an unspecified academic time is an explicitly estimated reminder. Conversation replies are not a substitute for completing those structured fields. The medication list is both the current tracker and historical log; duplicate checks span all logged entries and cannot establish a safe interval or dose. Ingredient estimates depend on product variants and are not a complete interaction database. Explicit label ingredients take precedence over catalog guesses.

Emergency matching is conservative and incomplete; a missing alert never establishes safety. Care suggestions are educational heuristics, not validated triage. AI wording may be inaccurate, while emergency routing and duplicate warnings remain deterministic.

## Reference sources

Resource URLs and contact details are centralized in `lib/resources/care-resources.ts`. Check the linked sites for current information:

- [Cornell Health appointments](https://health.cornell.edu/get-care/appointments)
- [Cornell Health contact information](https://health.cornell.edu/about/contact-us)
- [FDA acetaminophen safety](https://www.fda.gov/drugs/safe-use-over-counter-pain-relievers-and-fever-reducers/acetaminophen)
- [MedlinePlus: recognizing medical emergencies](https://medlineplus.gov/ency/article/001927.htm)
- [OpenAI Chat Completions reference](https://developers.openai.com/api/reference/resources/chat)
