// Deterministic staff → color mapping
const STAFF_COLORS = [
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

export function getStaffColor(staffId: string | null): string {
  if (!staffId) return "#0070f3";
  let hash = 0;
  for (let i = 0; i < staffId.length; i++) {
    hash = (hash * 31 + staffId.charCodeAt(i)) % STAFF_COLORS.length;
  }
  return STAFF_COLORS[hash];
}

export function assignRouteColors<T extends { staff_id: string | null }>(
  routes: T[]
): (T & { color: string })[] {
  return routes.map((r) => ({
    ...r,
    color: getStaffColor(r.staff_id),
  }));
}
