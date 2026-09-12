"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { buildSickDayPlan } from "@/lib/agents/sick-day";
import { emptyHealthState, isHealthState, STORAGE_KEY } from "@/lib/storage/state";
import { createId } from "@/lib/utils";
import type {
  AcademicObligation,
  ActiveSymptom,
  ChatMessage,
  HealthTask,
  HydrationLog,
  MedicationEntry,
  SleepLog,
  StateMutations,
  StudentHealthState,
  SymptomHistoryEntry,
  TemperatureReading,
  UpcomingAppointment,
} from "@/lib/types/health";

interface HealthContextValue {
  state: StudentHealthState;
  ready: boolean;
  messages: ChatMessage[];
  addSymptom: (symptom: Omit<ActiveSymptom, "id">) => void;
  updateSymptom: (id: string, patch: Partial<ActiveSymptom>) => void;
  addTemperature: (reading: Omit<TemperatureReading, "id">) => void;
  addMedication: (entry: Omit<MedicationEntry, "id">) => void;
  addSleepLog: (entry: Omit<SleepLog, "id">) => void;
  addHydration: (entry: Omit<HydrationLog, "id">) => void;
  addObligation: (entry: Omit<AcademicObligation, "id">) => void;
  addTask: (entry: Omit<HealthTask, "id">) => void;
  toggleTask: (id: string) => void;
  addAppointment: (entry: Omit<UpcomingAppointment, "id">) => void;
  togglePlanItem: (id: string) => void;
  refreshPlan: () => void;
  applyMutations: (mutations: StateMutations) => void;
  addMessage: (message: Omit<ChatMessage, "id" | "createdAt">) => void;
  removeEntry: (collection: "activeSymptoms" | "medications" | "academicObligations" | "upcomingAppointments" | "healthTasks", id: string) => void;
  resetState: () => void;
  loadDemo: () => void;
}

const HealthContext = createContext<HealthContextValue | null>(null);

function persist(state: StudentHealthState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* Session remains usable when storage is unavailable. */ }
}

export function HealthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StudentHealthState>(emptyHealthState);
  const [ready, setReady] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isHealthState(parsed)) setState(parsed);
      }
    } catch {
      // keep empty state
    }
    setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const commit = useCallback((updater: (current: StudentHealthState) => StudentHealthState) => {
    setState((current) => {
      const next = { ...updater(current), updatedAt: new Date().toISOString() };
      persist(next);
      return next;
    });
  }, []);

  const addSymptom = useCallback(
    (symptom: Omit<ActiveSymptom, "id">) => {
      commit((current) => {
        const id = createId("sx");
        const history: SymptomHistoryEntry = {
          id: createId("sxh"),
          at: new Date().toISOString(),
          symptomId: id,
          name: symptom.name,
          severity: symptom.severity,
          trend: symptom.trend,
        };
        return {
          ...current,
          activeSymptoms: [...current.activeSymptoms, { ...symptom, id }],
          symptomHistory: [...current.symptomHistory, history],
        };
      });
    },
    [commit],
  );

  const updateSymptom = useCallback(
    (id: string, patch: Partial<ActiveSymptom>) => {
      commit((current) => ({
        ...current,
        activeSymptoms: current.activeSymptoms.map((item) =>
          item.id === id ? { ...item, ...patch } : item,
        ),
      }));
    },
    [commit],
  );

  const addTemperature = useCallback(
    (reading: Omit<TemperatureReading, "id">) => {
      commit((current) => ({
        ...current,
        temperatureHistory: [
          ...current.temperatureHistory,
          { ...reading, id: createId("temp") },
        ],
      }));
    },
    [commit],
  );

  const addMedication = useCallback(
    (entry: Omit<MedicationEntry, "id">) => {
      commit((current) => ({
        ...current,
        medications: [...current.medications, { ...entry, id: createId("med") }],
      }));
    },
    [commit],
  );

  const addSleepLog = useCallback(
    (entry: Omit<SleepLog, "id">) => {
      commit((current) => ({
        ...current,
        sleepHistory: [...current.sleepHistory, { ...entry, id: createId("sleep") }],
      }));
    },
    [commit],
  );

  const addHydration = useCallback(
    (entry: Omit<HydrationLog, "id">) => {
      commit((current) => ({
        ...current,
        hydration: [...current.hydration, { ...entry, id: createId("hyd") }],
      }));
    },
    [commit],
  );

  const addObligation = useCallback(
    (entry: Omit<AcademicObligation, "id">) => {
      commit((current) => ({
        ...current,
        academicObligations: [
          ...current.academicObligations,
          { ...entry, id: createId("ob") },
        ],
      }));
    },
    [commit],
  );

  const addTask = useCallback(
    (entry: Omit<HealthTask, "id">) => {
      commit((current) => ({
        ...current,
        healthTasks: [...current.healthTasks, { ...entry, id: createId("task") }],
      }));
    },
    [commit],
  );

  const toggleTask = useCallback(
    (id: string) => {
      commit((current) => ({
        ...current,
        healthTasks: current.healthTasks.map((task) =>
          task.id === id ? { ...task, done: !task.done } : task,
        ),
      }));
    },
    [commit],
  );

  const addAppointment = useCallback(
    (entry: Omit<UpcomingAppointment, "id">) => {
      commit((current) => ({
        ...current,
        upcomingAppointments: [
          ...current.upcomingAppointments,
          { ...entry, id: createId("apt") },
        ],
      }));
    },
    [commit],
  );

  const togglePlanItem = useCallback(
    (id: string) => {
      commit((current) => ({
        ...current,
        sickDayPlan: current.sickDayPlan
          ? {
              ...current.sickDayPlan,
              items: current.sickDayPlan.items.map((item) =>
                item.id === id ? { ...item, done: !item.done } : item,
              ),
            }
          : current.sickDayPlan,
      }));
    },
    [commit],
  );

  const refreshPlan = useCallback(() => {
    commit((current) => ({ ...current, sickDayPlan: buildSickDayPlan(current) }));
  }, [commit]);

  const applyMutations = useCallback(
    (mutations: StateMutations) => {
      commit((current) => {
        const next: StudentHealthState = { ...current };
        if (mutations.symptoms?.length) {
          next.activeSymptoms = [...current.activeSymptoms];
          for (const symptom of mutations.symptoms) {
            const existing = next.activeSymptoms.findIndex((s) => s.name === symptom.name);
            if (existing >= 0) next.activeSymptoms.splice(existing, 1);
            {
              next.activeSymptoms.push(symptom);
              next.symptomHistory = [
                ...next.symptomHistory,
                {
                  id: createId("sxh"),
                  at: new Date().toISOString(),
                  symptomId: symptom.id,
                  name: symptom.name,
                  severity: symptom.severity,
                  trend: symptom.trend,
                },
              ];
            }
          }
        }
        if (mutations.temperatures?.length) {
          next.temperatureHistory = [
            ...current.temperatureHistory,
            ...mutations.temperatures,
          ];
        }
        if (mutations.medications?.length) {
          next.medications = [...current.medications, ...mutations.medications];
        }
        if (mutations.obligations?.length) {
          next.academicObligations = [
            ...current.academicObligations,
            ...mutations.obligations,
          ];
        }
        if (mutations.sleepLogs?.length) {
          next.sleepHistory = [...current.sleepHistory, ...mutations.sleepLogs];
        }
        if (mutations.hydration?.length) {
          next.hydration = [...current.hydration, ...mutations.hydration];
        }
        if (mutations.tasks?.length) {
          next.healthTasks = [...current.healthTasks, ...mutations.tasks];
        }
        if (mutations.appointments?.length) {
          next.upcomingAppointments = [
            ...current.upcomingAppointments,
            ...mutations.appointments,
          ];
        }
        if (mutations.importantNegatives !== undefined) next.importantNegatives = mutations.importantNegatives;
        if (mutations.sickDayPlan) next.sickDayPlan = mutations.sickDayPlan;
        if (mutations.careRecommendation) {
          next.lastCareRecommendation = mutations.careRecommendation;
        }
        return next;
      });
    },
    [commit],
  );

  const addMessage = useCallback((message: Omit<ChatMessage, "id" | "createdAt">) => {
    setMessages((current) => [
      ...current,
      {
        ...message,
        id: createId("msg"),
        createdAt: new Date().toISOString(),
      },
    ]);
  }, []);

  const removeEntry = useCallback((collection: "activeSymptoms" | "medications" | "academicObligations" | "upcomingAppointments" | "healthTasks", id: string) => {
    commit((current) => ({ ...current, [collection]: current[collection].filter((item) => item.id !== id), lastCareRecommendation: undefined, sickDayPlan: collection === "activeSymptoms" ? undefined : current.sickDayPlan }));
  }, [commit]);

  const resetState = useCallback(() => {
    const empty = emptyHealthState();
    persist(empty);
    setState(empty);
    setMessages([]);
  }, []);

  const loadDemo = useCallback(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(20, 0, 0, 0);
    const noon = new Date();
    noon.setHours(12, 0, 0, 0);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    const demo: StudentHealthState = {
      ...emptyHealthState(),
      activeSymptoms: [
        {
          id: "sx_demo_throat",
          name: "sore_throat",
          severity: 3,
          startedAt: yesterday.toISOString(),
          trend: "stable",
        },
        {
          id: "sx_demo_fever",
          name: "fever",
          severity: 3,
          startedAt: yesterday.toISOString(),
          trend: "worsening",
        },
      ],
      temperatureHistory: [
        {
          id: "temp_demo_1",
          at: new Date(yesterday.getTime() + 11 * 36e5).toISOString(),
          fahrenheit: 101.2,
        },
      ],
      medications: [
        {
          id: "med_demo_1",
          name: "DayQuil",
          dose: "see label",
          takenAt: noon.toISOString(),
          activeIngredients: ["acetaminophen", "dextromethorphan", "phenylephrine"],
          source: "manual",
        },
      ],
      academicObligations: [
        {
          id: "ob_demo_1",
          title: "Chemistry prelim",
          course: "CHEM",
          type: "exam",
          startsAt: tomorrow.toISOString(),
        },
      ],
      healthTasks: [
        {
          id: "task_demo_1",
          title: "Decide whether to notify the instructor tonight",
          kind: "other",
          done: false,
        },
      ],
    };
    demo.sickDayPlan = buildSickDayPlan(demo);
    persist(demo);
    setState(demo);
  }, []);

  const value = useMemo<HealthContextValue>(
    () => ({
      state,
      ready,
      messages,
      addSymptom,
      updateSymptom,
      addTemperature,
      addMedication,
      addSleepLog,
      addHydration,
      addObligation,
      addTask,
      toggleTask,
      addAppointment,
      togglePlanItem,
      refreshPlan,
      applyMutations,
      addMessage,
      removeEntry,
      resetState,
      loadDemo,
    }),
    [
      state,
      ready,
      messages,
      addSymptom,
      updateSymptom,
      addTemperature,
      addMedication,
      addSleepLog,
      addHydration,
      addObligation,
      addTask,
      toggleTask,
      addAppointment,
      togglePlanItem,
      refreshPlan,
      applyMutations,
      addMessage,
      removeEntry,
      resetState,
      loadDemo,
    ],
  );

  return <HealthContext.Provider value={value}>{children}</HealthContext.Provider>;
}

export function useHealth() {
  const ctx = useContext(HealthContext);
  if (!ctx) throw new Error("useHealth must be used within HealthProvider");
  return ctx;
}
