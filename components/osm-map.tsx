"use client";

import { useEffect, useState } from "react";

export function OsmMap({ query, className }: { query: string; className?: string }) {
  const googleMapsEmbedKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY;
  const useGoogleEmbed = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_EMBED_MAPS === "true";
  const [bbox, setBbox] = useState<string | null>(null);
  const [marker, setMarker] = useState<string | null>(null);

  useEffect(() => {
    if (!query || (googleMapsEmbedKey && useGoogleEmbed)) return;

    let isMounted = true;

    const fetchMap = async () => {
      try {
        const url = `/api/geocode?q=${encodeURIComponent(query)}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error("Proxy response was not ok");
        }
        
        const data = await response.json();

        if (!isMounted) return;

        if (data && data.length > 0) {
          const { lat, lon, boundingbox } = data[0];
          // Nominatim boundingbox is [minlat, maxlat, minlon, maxlon]
          // OSM iframe bbox is minlon, minlat, maxlon, maxlat
          // Add a small margin to the bbox
          const margin = 0.01;
          const minLat = parseFloat(boundingbox[0]) - margin;
          const maxLat = parseFloat(boundingbox[1]) + margin;
          const minLon = parseFloat(boundingbox[2]) - margin;
          const maxLon = parseFloat(boundingbox[3]) + margin;

          const box = `${minLon},${minLat},${maxLon},${maxLat}`;
          setBbox(box);
          setMarker(`${lat},${lon}`);
        } else {
          console.warn("OSM map query not found even with fallbacks:", query);
          setBbox("fallback");
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("OSM geocoding failed:", err);
        setBbox("fallback");
      }
    };

    fetchMap();

    return () => {
      isMounted = false;
    };
  }, [googleMapsEmbedKey, query, useGoogleEmbed]);

  if (googleMapsEmbedKey && useGoogleEmbed && query) {
    const params = new URLSearchParams({
      key: googleMapsEmbedKey,
      q: query,
      language: "ko",
      region: "KR"
    });

    return (
      <iframe
        className={className}
        width="100%"
        height="100%"
        style={{ border: 0, minHeight: "100%", minWidth: "100%" }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        src={`https://www.google.com/maps/embed/v1/place?${params.toString()}`}
      />
    );
  }

  if (!bbox) {
    return (
      <div className={`flex items-center justify-center bg-[#EEE8DD] text-sm font-bold text-moss ${className || "min-h-[280px] w-full"}`}>
        Loading Map Data...
      </div>
    );
  }

  if (bbox === "fallback") {
    return (
      <div className={`flex items-center justify-center bg-[#EEE8DD] text-sm font-bold text-moss ${className || "min-h-[280px] w-full"}`}>
        Map Not Available ({query})
      </div>
    );
  }

  return (
    <iframe
      className={className}
      width="100%"
      height="100%"
      style={{ border: 0, minHeight: "100%", minWidth: "100%" }}
      loading="lazy"
      allowFullScreen
      referrerPolicy="no-referrer-when-downgrade"
      src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`}
    />
  );
}
