import { create } from "zustand";
import { ScheduledVisit, ScheduledBreak } from "@/lib/scheduler/types";

interface ScheduleResultState {
  visits: ScheduledVisit[];
  /** Breaks reserved by the scheduler, so results can show them beside visits. */
  breaks: ScheduledBreak[];
  warnings: string[];
  hints: string[];
  hasResult: boolean;
  setResult: (
    visits: ScheduledVisit[],
    warnings: string[],
    hints: string[],
    breaks?: ScheduledBreak[]
  ) => void;
  clearResult: () => void;
}

export const useScheduleResultStore = create<ScheduleResultState>((set) => ({
  visits: [],
  breaks: [],
  warnings: [],
  hints: [],
  hasResult: false,
  // breaks is optional so call sites that predate it keep compiling; it simply
  // resets to empty when not supplied.
  setResult: (visits, warnings, hints, breaks = []) =>
    set({ visits, breaks, warnings, hints, hasResult: true }),
  clearResult: () =>
    set({ visits: [], breaks: [], warnings: [], hints: [], hasResult: false }),
}));
