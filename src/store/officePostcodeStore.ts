// src/store/officePostcodeStore.ts
import { create } from "zustand";
import { normalisePostcode } from "@/lib/validatePostcode";
import {
  loadFreeSchedulerData,
  saveFreeSchedulerData,
} from "@/lib/freeSession";

interface OfficePostcodeState {
  officePostcode: string;
  setOfficePostcode: (postcode: string) => void;
}

async function persistFree(officePostcode: string) {
  const data = (await loadFreeSchedulerData()) ?? {};
  await saveFreeSchedulerData({ ...data, officePostcode });
}

export const useOfficePostcodeStore = create<OfficePostcodeState>((set) => ({
  officePostcode: "",

  setOfficePostcode: (postcode) => {
    const normalised = postcode ? normalisePostcode(postcode) : "";
    persistFree(normalised);
    set({ officePostcode: normalised });
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
