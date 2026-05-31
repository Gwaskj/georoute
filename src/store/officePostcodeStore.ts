// src/store/officePostcodeStore.ts
import { create } from "zustand";
import {
  loadFreeSchedulerData,
  saveFreeSchedulerData,
  FreeSchedulerData,
} from "@/lib/freeSession";

interface OfficePostcodeState {
  officePostcode: string;
  setOfficePostcode: (postcode: string) => void;
}

async function persistFree(officePostcode: string) {
  const existing: FreeSchedulerData =
    (await loadFreeSchedulerData()) ?? {
      staff: [],
      appointments: [],
      routes: [],
      visits: [],
      officePostcode: null,
      selectedStaffIds: [],
    };

  await saveFreeSchedulerData({
    ...existing,
    officePostcode,
  });
}

export const useOfficePostcodeStore = create<OfficePostcodeState>((set) => ({
  officePostcode: "",

  setOfficePostcode: (postcode) => {
    const cleaned = postcode.trim().toUpperCase();
    persistFree(cleaned);
    set({ officePostcode: cleaned });
  },
}));

// INITIAL LOAD
if (typeof window !== "undefined") {
  loadFreeSchedulerData().then((data) => {
    if (data?.officePostcode) {
      useOfficePostcodeStore.getState().setOfficePostcode(data.officePostcode);
    }
  });
}
