import { create } from "zustand";
import { ScheduledVisit } from "@/lib/scheduler/types";

interface ScheduleResultState {
  visits: ScheduledVisit[];
  warnings: string[];
  hints: string[];
  hasResult: boolean;
  setResult: (visits: ScheduledVisit[], warnings: string[], hints: string[]) => void;
  clearResult: () => void;
}

export const useScheduleResultStore = create<ScheduleResultState>((set) => ({
  visits: [],
  warnings: [],
  hints: [],
  hasResult: false,
  setResult: (visits, warnings, hints) =>
    set({ visits, warnings, hints, hasResult: true }),
  clearResult: () => set({ visits: [], warnings: [], hints: [], hasResult: false }),
}));
