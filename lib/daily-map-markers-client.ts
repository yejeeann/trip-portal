"use client";

import { useEffect, useMemo, useState } from "react";
import { buildDailyMainRouteOverview } from "@/lib/daily-route-overview";
import type { DailyGuide } from "@/lib/swiss-guide-data";
import type { Coordinates, Trip } from "@/lib/types";

export type DailyMapMarker = Coordinates & {
  label: string;
  id?: string;
};

type GeocodeResult = {
  lat: string;
  lon: string;
};

export function isSmartFillGuide(guide?: DailyGuide | null) {
  return (
    !guide ||
    !guide.places ||
    guide.places.length === 0 ||
    guide.places.every((place) => place.category === "기준점" || place.category === "경유지")
  );
}

export function useDailyMapMarkers({
  guide,
  trip,
  includeAccommodation = false
}: {
  guide?: DailyGuide | null;
  trip: Trip;
  includeAccommodation?: boolean;
}) {
  const [dynamicMarkers, setDynamicMarkers] = useState<DailyMapMarker[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isSmartFill = isSmartFillGuide(guide);

  useEffect(() => {
    let active = true;

    async function loadMarkers() {
      if (!guide) {
        setDynamicMarkers([]);
        return;
      }

      setIsLoading(true);
      const city = guide.region?.split(" / ")[0] || "";
      const results: DailyMapMarker[] = [];
      const dayItin = trip.itinerary.find((day) => day.day === guide.day);

      if (isSmartFill) {
        if (dayItin?.coordinates?.lat && dayItin?.coordinates?.lng) {
          setDynamicMarkers([
            {
              lat: dayItin.coordinates.lat,
              lng: dayItin.coordinates.lng,
              label: "1",
              id: guide.places[0]?.id
            }
          ]);
        } else {
          setDynamicMarkers([]);
        }

        setIsLoading(false);
        return;
      }

      if (includeAccommodation && guide.accommodation?.address) {
        try {
          const lodgingCoords = await geocodePlace(guide.accommodation.address);
          if (lodgingCoords) {
            results.push({ ...lodgingCoords, label: "S", id: "accommodation" });
          }
        } catch {
          console.warn("Failed to geocode lodging:", guide.accommodation.name);
        }
      }

      const mainRouteOverview = buildDailyMainRouteOverview(guide);
      if (mainRouteOverview.length) {
        mainRouteOverview.forEach((point, index) => {
          results.push({
            lat: point.coordinates.lat,
            lng: point.coordinates.lng,
            label: String(index + 1),
            id: `route-overview-${point.id}`
          });
        });

        if (active) {
          setDynamicMarkers(results);
          setIsLoading(false);
        }
        return;
      }

      for (let i = 0; i < guide.places.length; i += 1) {
        const place = guide.places[i];

        if (place.coordinates?.lat && place.coordinates?.lng) {
          results.push({
            lat: place.coordinates.lat,
            lng: place.coordinates.lng,
            label: String(i + 1),
            id: place.id
          });
          continue;
        }

        try {
          const coords = await geocodePlace(`${place.name}, ${city}`);
          if (coords) {
            results.push({ ...coords, label: String(i + 1), id: place.id });
          }
        } catch {
          console.warn("Failed to geocode:", place.name);
        }
      }

      if (active) {
        setDynamicMarkers(results);
        setIsLoading(false);
      }
    }

    loadMarkers();

    return () => {
      active = false;
    };
  }, [guide, includeAccommodation, isSmartFill, trip.itinerary]);

  const markers = useMemo(() => {
    if (dynamicMarkers.length > 0) return dynamicMarkers;
    if (!guide) return [];

    const dayItin = trip.itinerary.find((day) => day.day === guide.day);
    if (dayItin?.coordinates?.lat && dayItin?.coordinates?.lng) {
      return [
        {
          lat: dayItin.coordinates.lat,
          lng: dayItin.coordinates.lng,
          label: "1"
        }
      ];
    }

    return [];
  }, [dynamicMarkers, guide, trip.itinerary]);

  return { markers, isLoading, isSmartFill };
}

async function geocodePlace(query: string): Promise<Coordinates | null> {
  const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
  if (!res.ok) return null;

  const data = (await res.json()) as GeocodeResult[] | null;
  if (!data || data.length === 0) return null;

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon)
  };
}
