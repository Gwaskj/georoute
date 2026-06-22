// src/store/callPurposeStore.ts
import { create } from "zustand";

export interface CallPurpose {
  id: string;
  name: string;
  start: string;
  end: string;
}

interface CallPurposeState {
  purposes: CallPurpose[];
  setPurposes: (purposes: CallPurpose[]) => void;
  addPurpose: (data: Omit<CallPurpose, "id">) => CallPurpose;
  updatePurpose: (id: string, updates: Partial<CallPurpose>) => void;
  deletePurpose: (id: string) => void;
}

export const useCallPurposeStore = create<CallPurposeState>((set, get) => ({
  purposes: [],

  setPurposes: (purposes) => {
    set({ purposes });
  },

  addPurpose: (data) => {
    const purpose: CallPurpose = {
      id: crypto.randomUUID(),
      ...data,
    };

    const purposes = [...get().purposes, purpose];
    set({ purposes });
    return purpose;
  },

  updatePurpose: (id, updates) => {
    const purposes = get().purposes.map((p) =>
      p.id === id ? { ...p, ...updates } : p
    );

    set({ purposes });
  },

  deletePurpose: (id) => {
    const purposes = get().purposes.filter((p) => p.id !== id);
    set({ purposes });
  },
}));

// INITIAL LOAD — now removed because call purposes are NOT persisted
