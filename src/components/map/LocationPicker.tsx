"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  useMap,
} from "@vis.gl/react-google-maps";
import {
  MapPinOff,
  Crosshair,
  Trash2,
  LocateFixed,
  MapPinned,
} from "lucide-react";
import { useMapsAuthFailure } from "@/hooks/useMapsAuthFailure";
import { MapErrorBoundary } from "./MapErrorBoundary";

/** Riyadh — the starting view before a point is chosen. */
const DEFAULT_CENTER = { lat: 24.7136, lng: 46.6753 };
const DEFAULT_ZOOM = 11;
const MAP_ID = "razeem-location-picker";

export interface PickedLocation {
  lat: number;
  lng: number;
}

export interface ResolvedPlace {
  formattedAddress: string;
  city: string | null;
  district: string | null;
  region: string | null;
}

interface LocationPickerProps {
  value: PickedLocation | null;
  onChange: (value: PickedLocation | null) => void;
  apiKey: string;
  /**
   * Called with the reverse-geocoded address after a pin is dropped, so the
   * form can fill city and district from the map instead of free typing.
   */
  onResolveAddress?: (place: ResolvedPlace) => void;
}

/**
 * Lets a publisher drop (and drag) a pin for the listing's exact position.
 * Coordinates are optional — a listing without them simply never appears on
 * the map — so a missing or rejected key degrades to an explanatory note
 * rather than blocking the form.
 */
export function LocationPicker({
  value,
  onChange,
  apiKey,
  onResolveAddress,
}: LocationPickerProps) {
  const hasUsableKey = apiKey.length > 30 && apiKey.startsWith("AIza");

  if (!hasUsableKey) {
    return <PickerUnavailable />;
  }

  return (
    <MapErrorBoundary fallback={<PickerUnavailable />}>
      <APIProvider apiKey={apiKey}>
        <PickerCanvas
          value={value}
          onChange={onChange}
          onResolveAddress={onResolveAddress}
        />
      </APIProvider>
    </MapErrorBoundary>
  );
}

function PickerUnavailable() {
  const t = useTranslations();

  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center bg-gray-50 border border-dashed border-gray-300 rounded-xl">
      <MapPinOff className="w-6 h-6 text-gray-400" aria-hidden="true" />
      <p className="text-sm text-gray-500 max-w-sm">
        {t("locationPicker.unavailable")}
      </p>
    </div>
  );
}

function PickerCanvas({
  value,
  onChange,
  onResolveAddress,
}: {
  value: PickedLocation | null;
  onChange: (value: PickedLocation | null) => void;
  onResolveAddress?: (place: ResolvedPlace) => void;
}) {
  const t = useTranslations();
  const authFailed = useMapsAuthFailure();
  const [geoError, setGeoError] = useState("");
  const [isResolving, setIsResolving] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState("");

  /**
   * Ask the server to turn the pin into an address. The key lives server-side,
   * so this goes through our own endpoint rather than calling Google directly.
   */
  const resolve = useCallback(
    async (place: PickedLocation) => {
      if (!onResolveAddress) return;

      setIsResolving(true);
      try {
        const res = await fetch(
          `/api/geocode?lat=${place.lat}&lng=${place.lng}`
        );
        if (!res.ok) return;

        const data = await res.json();
        if (!data.available || !data.address) return;

        setResolvedAddress(data.address.formattedAddress ?? "");
        onResolveAddress(data.address);
      } catch {
        // A failed lookup just leaves the typed address alone.
      } finally {
        setIsResolving(false);
      }
    },
    [onResolveAddress]
  );

  function pick(next: PickedLocation) {
    onChange(next);
    void resolve(next);
  }

  if (authFailed) return <PickerUnavailable />;

  return (
    <div>
      <div className="relative h-[300px] rounded-xl overflow-hidden border border-gray-200">
        <Map
          mapId={MAP_ID}
          defaultCenter={value ?? DEFAULT_CENTER}
          defaultZoom={value ? 15 : DEFAULT_ZOOM}
          gestureHandling="greedy"
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={false}
          className="w-full h-full"
          onClick={(e) => {
            const latLng = e.detail.latLng;
            if (latLng) pick({ lat: latLng.lat, lng: latLng.lng });
          }}
        >
          {value && (
            <AdvancedMarker
              position={value}
              draggable
              onDragEnd={(e) => {
                const latLng = e.latLng;
                if (latLng) pick({ lat: latLng.lat(), lng: latLng.lng() });
              }}
            >
              <Pin
                background="#123B3A"
                borderColor="#0B2726"
                glyphColor="#ffffff"
              />
            </AdvancedMarker>
          )}

          {value && <RecenterOnPin position={value} />}
        </Map>

        {!value && (
          <p className="absolute inset-x-3 top-3 px-3 py-2 text-sm text-center text-gray-700 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm pointer-events-none">
            {t("locationPicker.hint")}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 mt-2">
        <UseMyLocationButton onPicked={pick} onError={setGeoError} />

        {value && (
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setResolvedAddress("");
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-red-600 hover:border-red-200 transition-[color,background-color,border-color] focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none min-h-[44px]"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            {t("locationPicker.clear")}
          </button>
        )}

        {value && (
          <span className="text-xs text-gray-500 font-mono" dir="ltr">
            {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
          </span>
        )}
      </div>

      {(isResolving || resolvedAddress) && (
        <p className="flex items-center gap-1.5 mt-2 text-sm text-gray-600">
          {isResolving ? (
            <>
              <Crosshair className="w-4 h-4 animate-pulse shrink-0" aria-hidden="true" />
              {t("locationPicker.resolving")}
            </>
          ) : (
            <>
              <MapPinned className="w-4 h-4 shrink-0 text-primary" aria-hidden="true" />
              {resolvedAddress}
            </>
          )}
        </p>
      )}

      {geoError && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {geoError}
        </p>
      )}
    </div>
  );
}

/** Keeps the viewport following the pin when it is set programmatically. */
function RecenterOnPin({ position }: { position: PickedLocation }) {
  const map = useMap();
  const [lastCentered, setLastCentered] = useState<string | null>(null);
  const key = `${position.lat},${position.lng}`;

  // Panning is an imperative call on the map instance; guard so it only runs
  // when the pin actually moves rather than on every render.
  if (map && lastCentered !== key) {
    setLastCentered(key);
    map.panTo(position);
  }

  return null;
}

function UseMyLocationButton({
  onPicked,
  onError,
}: {
  onPicked: (value: PickedLocation) => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations();
  const [isLocating, setIsLocating] = useState(false);

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      onError(t("locationPicker.geoUnsupported"));
      return;
    }

    setIsLocating(true);
    onError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onPicked({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLocating(false);
      },
      () => {
        onError(t("locationPicker.geoDenied"));
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onPicked, onError, t]);

  return (
    <button
      type="button"
      onClick={locate}
      disabled={isLocating}
      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 disabled:opacity-50 transition-colors focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none min-h-[44px]"
    >
      {isLocating ? (
        <Crosshair className="w-4 h-4 animate-pulse" aria-hidden="true" />
      ) : (
        <LocateFixed className="w-4 h-4" aria-hidden="true" />
      )}
      {t("locationPicker.useMyLocation")}
    </button>
  );
}
