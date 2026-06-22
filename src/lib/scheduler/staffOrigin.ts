// Resolves where a staff member's working day starts/ends, based on their
// per-staff startLocation choice. Shared by the scheduling engine and the
// map/results-column display so both always agree on the same anchor point.

export interface StaffOriginInput {
  startLocation?: "home" | "office";
  homePostcode: string;
  officePostcode: string;
}

export function getStaffOriginPostcode(
  staff: StaffOriginInput,
  globalOfficePostcode: string | null
): string {
  if (staff.startLocation === "home") {
    return staff.homePostcode || staff.officePostcode || globalOfficePostcode || "";
  }
  return staff.officePostcode || globalOfficePostcode || "";
}
