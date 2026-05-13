"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export type OsmMarker = {
  lat: number;
  lng: number;
  label: string;
  onClickUrl?: string;
  id?: string;
};

type MultiOsmMapProps = {
  markers: OsmMarker[];
  className?: string;
  onMarkerClick?: (id: string) => void;
  fitPadding?: number;
  maxZoom?: number;
};

export function MultiOsmMap({
  markers,
  className,
  onMarkerClick,
  fitPadding = 36,
  maxZoom = 15
}: MultiOsmMapProps) {
  const router = useRouter();
  const googleMapsEmbedKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY;
  const useGoogleEmbed = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_EMBED_MAPS === "true";

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "markerClick") {
        if (onMarkerClick && event.data.id) {
          onMarkerClick(event.data.id);
        } else if (event.data.url) {
          router.push(event.data.url);
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onMarkerClick, router]);

  if (!markers || markers.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-[#EEE8DD] text-sm font-bold text-moss ${className || "min-h-[280px] w-full"}`}>
        지도 데이터가 부족합니다.
      </div>
    );
  }

  if (googleMapsEmbedKey && useGoogleEmbed && markers.length <= 2) {
    const src = getGoogleMapsEmbedUrl(markers, googleMapsEmbedKey);

    return (
      <iframe
        className={className}
        width="100%"
        height="100%"
        style={{ border: 0, minHeight: "100%", minWidth: "100%" }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        src={src}
      />
    );
  }

  // Use Leaflet in an iframe
  // Calculate bounds to fit all markers
  const lats = markers.map(m => m.lat);
  const lngs = markers.map(m => m.lng);
  const rawMinLat = Math.min(...lats);
  const rawMaxLat = Math.max(...lats);
  const rawMinLng = Math.min(...lngs);
  const rawMaxLng = Math.max(...lngs);
  const isSingleMarker = markers.length === 1;
  const latRange = Math.max(rawMaxLat - rawMinLat, isSingleMarker ? 0.012 : 0.0025);
  const lngRange = Math.max(rawMaxLng - rawMinLng, isSingleMarker ? 0.012 : 0.0025);
  const latPadding = Math.min(Math.max(latRange * 0.22, isSingleMarker ? 0.006 : 0.002), 0.35);
  const lngPadding = Math.min(Math.max(lngRange * 0.22, isSingleMarker ? 0.006 : 0.002), 0.35);
  const minLat = rawMinLat - latPadding;
  const maxLat = rawMaxLat + latPadding;
  const minLng = rawMinLng - lngPadding;
  const maxLng = rawMaxLng + lngPadding;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
        <style>
          body, html { margin: 0; padding: 0; height: 100%; width: 100%; }
          #map { height: 100vh; width: 100vw; background: transparent; }
          .custom-marker {
            color: #ffffff;
            font-weight: 800;
            font-size: 12px;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: none;
            border: none;
          }
          .marker-content {
            background-color: #0ea5e9; /* Tailwind sky-500 */
            border-radius: 50%;
            width: 24px;
            height: 24px;
            border: 2.5px solid #ffffff;
            box-shadow: 0 3px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s ease, background-color 0.2s ease;
            cursor: pointer;
          }
          .custom-marker:hover .marker-content {
            transform: scale(1.15);
            background-color: #0284c7;
          }
          /* 다크 모드일 때 지도를 어둡게 반전시키는 영리한 CSS 트릭 */
          @media (prefers-color-scheme: dark) {
            .leaflet-layer,
            .leaflet-control-zoom-in,
            .leaflet-control-zoom-out,
            .leaflet-control-attribution {
              filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
            }
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map');
          var bounds = L.latLngBounds([
            [${minLat}, ${minLng}],
            [${maxLat}, ${maxLng}]
          ]);
          map.fitBounds(bounds, {
            padding: [${fitPadding}, ${fitPadding}],
            maxZoom: ${maxZoom}
          });
          
          /* Mapbox 느낌의 모던한 CARTO Voyager 타일 적용 */
          L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap &copy; CARTO',
            maxZoom: 19
          }).addTo(map);

          var latlngs = [];
          ${markers.map((m, i) => `
            var icon_${i} = L.divIcon({
              className: 'custom-marker',
              html: '<div class="marker-content">${m.label}</div>',
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            });
            var marker_${i} = L.marker([${m.lat}, ${m.lng}], {icon: icon_${i}}).addTo(map);
        ${m.onClickUrl || m.id ? `
            marker_${i}.on('click', function() {
          window.parent.postMessage({ type: 'markerClick', url: '${m.onClickUrl || ""}', id: '${m.id || ""}' }, '*');
            });
            ` : ""}
            latlngs.push([${m.lat}, ${m.lng}]);
          `).join('\n')}

          if (latlngs.length > 1) {
            /* 점선 및 하늘색(Sky-500) 여행 앱 스타일 경로선 적용 */
            L.polyline(latlngs, {color: '#0ea5e9', weight: 4, dashArray: '6, 8', opacity: 0.8, lineCap: 'round', lineJoin: 'round'}).addTo(map);
          }
        </script>
      </body>
    </html>
  `;

  return (
    <iframe
      className={className}
      width="100%"
      height="100%"
      style={{ border: 0, minHeight: "100%", minWidth: "100%" }}
      loading="lazy"
      allowFullScreen
      srcDoc={html}
    />
  );
}

function getGoogleMapsEmbedUrl(markers: OsmMarker[], key: string) {
  if (markers.length === 1) {
    const marker = markers[0];
    const params = new URLSearchParams({
      key,
      q: `${marker.lat},${marker.lng}`,
      zoom: "13",
      language: "ko",
      region: "KR"
    });

    return `https://www.google.com/maps/embed/v1/place?${params.toString()}`;
  }

  const origin = markers[0];
  const destination = markers[markers.length - 1];
  const waypoints = markers.slice(1, -1).map((marker) => `${marker.lat},${marker.lng}`).join("|");
  const params = new URLSearchParams({
    key,
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    mode: "driving",
    language: "ko",
    region: "KR",
    units: "metric"
  });

  if (waypoints) {
    params.set("waypoints", waypoints);
  }

  return `https://www.google.com/maps/embed/v1/directions?${params.toString()}`;
}
