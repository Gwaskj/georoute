import { create } from "zustand";

type HighlightState = {
  highlightedAppointmentId: string | null;
  highlightedRouteId: string | null;

  setHighlightedAppointment: (id: string | null) => void;
  setHighlightedRoute: (id: string | null) => void;
  clear: () => void;
};

export const useHighlightStore = create<HighlightState>((set: (fn: (state: HighlightState) => HighlightState) => void) => ({
  highlightedAppointmentId: null,
  highlightedRouteId: null,

  setHighlightedAppointment: (id: string | null) =>
    set((state) => ({
      ...state,
      highlightedAppointmentId: id,
      highlightedRouteId: null,
    })),

  setHighlightedRoute: (id: string | null) =>
    set((state) => ({
      ...state,
      highlightedRouteId: id,
      highlightedAppointmentId: null,
    })),

  clear: () =>
    set((state) => ({
      ...state,
      highlightedAppointmentId: null,
      highlightedRouteId: null,
    })),
}));
