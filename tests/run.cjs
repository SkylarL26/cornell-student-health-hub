/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test harness compiles TS in memory. */
/* Compile application TS in memory using the project's TypeScript dependency. */
const ts = require('typescript');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const original = Module._resolveFilename;
Module._resolveFilename = function (name, ...args) { return original.call(this, name.startsWith('@/') ? path.join(__dirname, '..', name.slice(2)) : name, ...args); };
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { emptyHealthState, isHealthState } = require('../lib/storage/state.ts');
const { orchestrate } = require('../lib/ai/orchestrator.ts');
const { inferIngredients } = require('../lib/safety/medications.ts');
const { POST } = require('../app/api/assistant/route.ts');
const { recommendCareLevel } = require('../lib/safety/care-levels.ts');
process.env.OPENAI_API_KEY = '';
const demo = "I've had a sore throat and fever since yesterday. I took DayQuil around noon and I have a chemistry prelim tomorrow morning.";
test('demo coordinates symptoms, medication, academics, care, and plan', async () => {
  const result = await orchestrate({ message: demo, state: emptyHealthState() });
  for (const intent of ['SYMPTOMS', 'MEDICATION', 'ACADEMIC_SUPPORT', 'CARE_NAVIGATION']) assert.ok(result.intents.includes(intent));
  assert.equal(result.mutations.symptoms.length, 2);
  assert.equal(result.mutations.medications[0].name.toLowerCase(), 'dayquil');
  assert.equal(result.mutations.obligations[0].course, 'chemistry');
  assert.ok(result.professorDraft.includes('chemistry'));
  assert.ok(result.mutations.sickDayPlan.items.some(i => /exam or class/.test(i.text)));
  const state = { ...emptyHealthState(), medications: result.mutations.medications };
  const follow = await orchestrate({ message: 'Can I take Tylenol?', state });
  assert.ok(follow.duplicateWarnings.some(w => w.ingredient === 'acetaminophen'));
  assert.equal(follow.mutations.medications, undefined);
});
test('does not record a negated medication or symptom report', async () => {
  const result = await orchestrate({ message: "I have not taken Tylenol. No fever. I have a cough.", state: emptyHealthState() });
  assert.equal(result.mutations.medications, undefined);
  assert.deepEqual(result.mutations.symptoms.map(s => s.name), ['cough']);
});
test('compares two products mentioned in the same request', async () => {
  const result = await orchestrate({ message: 'Can I combine DayQuil and Tylenol?', state: emptyHealthState() });
  assert.ok(result.duplicateWarnings.length);
  assert.equal(result.mutations.medications, undefined);
});
test('emergency bypasses ordinary workflows and produces no routine plan', async () => {
  const result = await orchestrate({ message: 'I can’t breathe and have a prelim.', state: emptyHealthState() });
  assert.equal(result.emergency, true);
  assert.match(result.reply, /911/);
  assert.equal(result.mutations.sickDayPlan, undefined);
  assert.deepEqual(result.followUpQuestions, []);
});
test('preserves temperature decimals', async () => {
  const result = await orchestrate({ message: 'My temperature is 101.2 F', state: emptyHealthState() });
  assert.equal(result.mutations.temperatures[0].fahrenheit, 101.2);
});
test('strict state validation rejects corrupt records', () => {
  assert.ok(isHealthState(emptyHealthState()));
  assert.equal(isHealthState({ version: 1, activeSymptoms: [] }), false);
  assert.equal(isHealthState({ ...emptyHealthState(), medications: [null] }), false);
});
test('label-provided ingredients take precedence over a brand guess', () => {
  assert.deepEqual(inferIngredients('DayQuil', ['APAP']), ['acetaminophen']);
  assert.deepEqual(inferIngredients('unknown product'), []);
});
test('severe symptoms receive same-day guidance', () => {
  const state = { ...emptyHealthState(), activeSymptoms: [{ id: 's', name: 'pain', severity: 5, trend: 'stable', startedAt: new Date().toISOString() }] };
  assert.equal(recommendCareLevel({ state, redFlags: [] }).level, 'same_day_campus');
});
test('API rejects malformed bodies and invalid state', async () => {
  const invalid = await POST(new Request('http://localhost/api/assistant', { method: 'POST', body: '{' }));
  assert.equal(invalid.status, 400);
  const badState = await POST(new Request('http://localhost/api/assistant', { method: 'POST', body: JSON.stringify({ message: 'hello', state: { version: 1, activeSymptoms: [null] } }) }));
  assert.equal(badState.status, 400);
});
test('negated emergency signs do not trigger, but another positive sign does', async () => {
  const negative = await orchestrate({ message: 'No severe chest pain. No severe trouble breathing.', state: emptyHealthState() });
  assert.equal(negative.emergency, false);
  const mixed = await orchestrate({ message: "No severe chest pain but I can't breathe", state: emptyHealthState() });
  assert.equal(mixed.emergency, true);
});
test('browser timezone is used for noon and tomorrow morning', async () => {
  const result = await orchestrate({ message: demo, state: emptyHealthState(), timezoneOffset: 240 });
  assert.equal(new Date(result.mutations.medications[0].takenAt).getUTCHours(), 16);
  assert.equal(new Date(result.mutations.obligations[0].startsAt).getUTCHours(), 13);
  assert.equal(result.mutations.symptoms[0].severity, null);
  assert.equal(result.mutations.symptoms[0].trend, 'unknown');
});
test('appointment timeline orders by timestamp and does not invent negatives', () => {
  const { buildAppointmentSummary } = require('../lib/agents/appointment.ts');
  const state = { ...emptyHealthState(), temperatureHistory: [{ id: 'a', at: '2026-09-10T10:00:00Z', fahrenheit: 101.2 }, { id: 'b', at: '2026-09-09T10:00:00Z', fahrenheit: 100.4 }] };
  const summary = buildAppointmentSummary(state);
  assert.ok(summary.indexOf('100.4') < summary.indexOf('101.2'));
  assert.match(summary, /No important negatives explicitly recorded/);
});
