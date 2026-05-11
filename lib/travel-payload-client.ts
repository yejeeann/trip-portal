"use client";

import { useEffect, useState } from "react";
import { fallbackTravelPayload } from "@/lib/fallback-travel";
import type { TravelPayload } from "@/lib/types";

export function useTravelPayload(timeoutMs = 8000) {
  const [payload, setPayload] = useState<TravelPayload | null>(fallbackTravelPayload);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    async function loadTravelContext() {
      try {
        const response = await fetch("/api/travel", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("API error");
        const data = (await response.json()) as TravelPayload;
        if (active) setPayload(data);
      } catch (err) {
        console.warn("Travel data fetch timeout or error:", err);
        if (active) setPayload(fallbackTravelPayload);
      } finally {
        clearTimeout(timeoutId);
        if (active) setIsLoading(false);
      }
    }

    loadTravelContext();

    return () => {
      active = false;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [timeoutMs]);

  return { payload, isLoading };
}
