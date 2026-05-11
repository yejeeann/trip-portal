import { NextResponse } from "next/server";

const geocodeCache = new Map<string, any>();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  // Check cache first
  if (geocodeCache.has(query)) {
    return NextResponse.json(geocodeCache.get(query));
  }

  try {
    const fetchGeocode = async (q: string) => {
      const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    };

    let data = await fetchGeocode(query);

    // Fallbacks if empty
    if ((!data.features || data.features.length === 0) && query.includes(",")) {
      data = await fetchGeocode(query.split(",")[0].trim());
    }
    
    if ((!data.features || data.features.length === 0) && query.includes(" ")) {
      data = await fetchGeocode(query.split(" ")[0].trim());
    }

    if (data.features && data.features.length > 0) {
      // Prefer countries, states, and major cities over small villages or points of interest
      const sortedFeatures = data.features.sort((a: any, b: any) => {
        const getScore = (f: any) => {
          const type = f.properties.osm_value || f.properties.type || "";
          if (type === "country") return 10;
          if (type === "state") return 9;
          if (type === "city") return 8;
          if (type === "town") return 7;
          if (type === "village") return 6;
          if (type === "hamlet") return 5;
          if (type === "suburb" || type === "district") return 4;
          return 0;
        };
        return getScore(b) - getScore(a);
      });

      const feature = sortedFeatures[0];
      let boundingbox = null;
      
      if (feature.properties.extent) {
        // Photon extent: [minLon, maxLat, maxLon, minLat]
        const [minLon, maxLat, maxLon, minLat] = feature.properties.extent;
        // Map to Nominatim format: [minLat, maxLat, minLon, maxLon]
        boundingbox = [minLat.toString(), maxLat.toString(), minLon.toString(), maxLon.toString()];
      } else {
        const [lon, lat] = feature.geometry.coordinates;
        boundingbox = [(lat - 0.05).toString(), (lat + 0.05).toString(), (lon - 0.05).toString(), (lon + 0.05).toString()];
      }

      const result = [{
        lat: feature.geometry.coordinates[1].toString(),
        lon: feature.geometry.coordinates[0].toString(),
        boundingbox
      }];

      geocodeCache.set(query, result);
      return NextResponse.json(result);
    }

    return NextResponse.json([]);
  } catch (error: any) {
    console.error("Geocoding API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
