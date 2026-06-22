// Stable color palette for staff routes and markers
const COLORS = [
  "#0070f3",
  "#d00000",
  "#ff8800",
  "#009624",
  "#6a00f4",
  "#b000b5",
  "#00838f",
  "#795548",
  "#455a64",
  "#c51162",
];

export function getColorForStaff(staffId: string | null): string {
  if (!staffId) return COLORS[0];
  let hash = 0;
  for (let i = 0; i < staffId.length; i++) {
    hash = (hash * 31 + staffId.charCodeAt(i)) % COLORS.length;
  }
  return COLORS[hash];
}

export function applyStaffColors<T extends { staff_id: string | null }>(
  items: T[]
): (T & { color: string })[] {
  return items.map((item) => ({
    ...item,
    color: getColorForStaff(item.staff_id),
  }));
}
