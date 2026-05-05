"use client";

import { useState } from "react";
import { isProUser } from "@/lib/isPro";
import { saveRoute } from "@/actions/saveRoute";

interface SaveRouteButtonProps {
  route: {
    start_lat: number;
    start_lon: number;
    end_lat: number;
    end_lon: number;
    route_data: any; // ORS JSON
  };
}

export default function SaveRouteButton({ route }: SaveRouteButtonProps) {
  const [loading, setLoading] = useState(false);
  const [allowed, setAllowed] = useState(false);

  async function check() {
    const pro = await isProUser();
    setAllowed(pro);
  }

  async function save() {
    setLoading(true);
    const res = await saveRoute(route);
    setLoading(false);

    if (res.error) alert(res.error);
    else alert("Route saved");
  }

  return (
    <div>
      <button onClick={check} className="px-4 py-2 bg-gray-200 rounded">
        Check Access
      </button>

      {allowed && (
        <button
          onClick={save}
          className="ml-2 px-4 py-2 bg-black text-white rounded"
        >
          {loading ? "Saving..." : "Save Route"}
        </button>
      )}
    </div>
  );
}
