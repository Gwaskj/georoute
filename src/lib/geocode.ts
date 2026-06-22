export async function geocodePostcodes(
  postcodes: string[]
): Promise<Map<string, { lat: number; lng: number }>> {
  const unique = [...new Set(postcodes.map((p) => p.trim().toUpperCase()).filter(Boolean))];
  if (unique.length === 0) return new Map();

  try {
    const res = await fetch("https://api.postcodes.io/postcodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postcodes: unique }),
    });
    if (!res.ok) return new Map();

    const json = await res.json();
    const result = new Map<string, { lat: number; lng: number }>();
    for (const item of json.result ?? []) {
      if (item.result) {
        result.set(item.query.toUpperCase(), {
          lat: item.result.latitude,
          lng: item.result.longitude,
        });
      }
    }
    return result;
  } catch {
    return new Map();
  }
}
