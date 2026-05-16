// src/store/officePostcodeStore.ts

import { create } from "zustand";
import { normalisePostcode } from "@/lib/validatePostcode";

interface OfficePostcodeState {
  officePostcode: string;
  setOfficePostcode: (postcode: string) => void;
}

const STORAGE_KEY = "georoute_office_postcode";

function loadInitialOfficePostcode(): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw || "";
  } catch {
    return "";
  }
}

function persistOfficePostcode(postcode: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, postcode);
  } catch {}
}

export const useOfficePostcodeStore = create<OfficePostcodeState>((set) => ({
  officePostcode: "",

  setOfficePostcode: (postcode) => {
    const normalised = postcode ? normalisePostcode(postcode) : "";
    persistOfficePostcode(normalised);
    set({ officePostcode: normalised });
  },
}));

if (typeof window !== "undefined") {
  const initial = loadInitialOfficePostcode();
  if (initial) {
    useOfficePostcodeStore.getState().setOfficePostcode(initial);
  }
}
