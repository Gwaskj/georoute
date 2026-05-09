import { create } from "zustand";

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
  } catch {
    // ignore
  }
}

export const useOfficePostcodeStore = create<OfficePostcodeState>((set) => ({
  officePostcode: "",
  setOfficePostcode: (officePostcode) => {
    persistOfficePostcode(officePostcode);
    set({ officePostcode });
  },
}));

if (typeof window !== "undefined") {
  const initial = loadInitialOfficePostcode();
  if (initial) {
    useOfficePostcodeStore.getState().setOfficePostcode(initial);
  }
}
