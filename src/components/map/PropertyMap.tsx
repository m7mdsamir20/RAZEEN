"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  Pin,
  useMap,
  useApiLoadingStatus,
  APILoadingStatus,
} from "@vis.gl/react-google-maps";
import { Loader2, Crosshair, SearchX } from "lucide-react";
import { useMapsAuthFailure } from "@/hooks/useMapsAuthFailure";
import { categoryColor, categoryBorderColor } from "@/lib/categories";
import { MapPopupCard } from "./MapPopupCard";
import { MapUnavailable } from "./MapUnavailable";
import { MapErrorBoundary } from "./MapErrorBoundary";
import type { MapProperty } from "@/lib/queries/map";

/** Riyadh — a sensible default before the markers are fitted. */
const DEFAULT_CENTER = { lat: 24.7136, lng: 46.6753 };
const DEFAULT_ZOOM = 6;
/** Required by Advanced Markers; any non-empty id enables vector rendering. */
const MAP_ID = "razeem-property-map";

interface PropertyMapProps {
  properties: MapProperty[];
  apiKey: string;
  /** Rendered at a fixed height inside the property detail page. */
  compact?: boolean;
}

export function PropertyMap({
  properties,
  apiKey,
  compact = false,
}: PropertyMapProps) {
  // A placeholder key would load a broken canvas — refuse it up front.
  const hasUsableKey = apiKey.length > 30 && apiKey.startsWith("AIza");

  if (!hasUsableKey) {
    return <MapUnavailable reason="missing" />;
  }

  return (
    <MapErrorBoundary fallback={<MapUnavailable reason="auth" />}>
      <APIProvider apiKey={apiKey}>
        <MapCanvas properties={properties} compact={compact} />
      </APIProvider>
    </MapErrorBoundary>
  );
}

function MapCanvas({
  properties,
  compact,
}: {
  properties: MapProperty[];
  compact: boolean;
}) {
  const t = useTranslations();
  const status = useApiLoadingStatus();
  // The library never sets AUTH_FAILURE itself — see useMapsAuthFailure.
  const authFailed = useMapsAuthFailure();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (
    authFailed ||
    status === APILoadingStatus.AUTH_FAILURE ||
    status === APILoadingStatus.FAILED
  ) {
    return <MapUnavailable reason="auth" />;
  }

  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] px-4 py-16 text-center bg-gray-50 rounded-2xl border border-gray-200">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <SearchX className="w-8 h-8 text-gray-400" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          {t("map.noPropertiesTitle")}
        </h2>
        <p className="text-base text-gray-500 max-w-sm">
          {t("map.noPropertiesDesc")}
        </p>
      </div>
    );
  }

  const selected = properties.find((p) => p.id === selectedId) ?? null;

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-gray-200 ${
        compact
          ? "h-[380px] sm:h-[440px]"
          : "h-[70vh] min-h-[520px] lg:h-[calc(100vh-160px)]"
      }`}
    >
      {status === APILoadingStatus.LOADING && (
        <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-gray-50">
          <Loader2
            className="w-5 h-5 animate-spin text-gray-400"
            aria-hidden="true"
          />
          <span className="text-sm text-gray-500">{t("map.loading")}</span>
        </div>
      )}

      <Map
        mapId={MAP_ID}
        defaultCenter={DEFAULT_CENTER}
        defaultZoom={DEFAULT_ZOOM}
        gestureHandling="greedy"
        disableDefaultUI={false}
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={!compact}
        className="w-full h-full"
        onClick={() => setSelectedId(null)}
      >
        <FitToMarkers properties={properties} />

        {properties.map((property) => (
          <AdvancedMarker
            key={property.id}
            position={{ lat: property.latitude, lng: property.longitude }}
            title={property.title}
            onClick={() => setSelectedId(property.id)}
          >
            <Pin
              background={categoryColor(property.category)}
              borderColor={categoryBorderColor(property.category)}
              glyphColor="#ffffff"
              scale={selectedId === property.id ? 1.25 : 1}
            />
          </AdvancedMarker>
        ))}

        {selected && (
          <InfoWindow
            position={{ lat: selected.latitude, lng: selected.longitude }}
            pixelOffset={[0, -38]}
            onCloseClick={() => setSelectedId(null)}
            headerDisabled
          >
            <MapPopupCard property={selected} />
          </InfoWindow>
        )}
      </Map>

      {!compact && <RecenterButton properties={properties} />}
    </div>
  );
}

/** Compute the bounds that hold every marker, or null when there are none. */
function markerBounds(properties: MapProperty[]) {
  if (properties.length === 0) return null;

  const bounds = new google.maps.LatLngBounds();
  for (const property of properties) {
    bounds.extend({ lat: property.latitude, lng: property.longitude });
  }
  return bounds;
}

/**
 * Frames all markers once the map is ready. Keyed remounts (on filter change)
 * re-run this, so the view always follows the current result set.
 */
function FitToMarkers({ properties }: { properties: MapProperty[] }) {
  const map = useMap();
  const [hasFitted, setHasFitted] = useState(false);

  // Fitting is an imperative call on an external object, driven by render —
  // guarded so it runs once per mount rather than on every re-render.
  if (map && !hasFitted && properties.length > 0) {
    setHasFitted(true);

    const bounds = markerBounds(properties);
    if (bounds) {
      map.fitBounds(bounds, 64);
      // A single marker fits to maximum zoom, which is unusably close.
      if (properties.length === 1) map.setZoom(14);
    }
  }

  return null;
}

function RecenterButton({ properties }: { properties: MapProperty[] }) {
  const t = useTranslations();
  const map = useMap();

  const recenter = useCallback(() => {
    if (!map) return;
    const bounds = markerBounds(properties);
    if (!bounds) return;

    map.fitBounds(bounds, 64);
    if (properties.length === 1) map.setZoom(14);
  }, [map, properties]);

  return (
    <button
      onClick={recenter}
      aria-label={t("map.recenter")}
      className="absolute bottom-6 start-3 z-10 flex items-center justify-center w-11 h-11 bg-white text-gray-700 rounded-xl shadow-md border border-gray-200 hover:text-primary hover:border-primary/30 transition-[color,border-color] focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none"
    >
      <Crosshair className="w-5 h-5" aria-hidden="true" />
    </button>
  );
}
