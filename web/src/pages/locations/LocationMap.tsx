import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useQueryClient } from "@tanstack/react-query";
import { MapPin, Loader2, Crosshair } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { api, type Location, type GeocodeSummary } from "../../api";
import { useLocations } from "../../lib/hooks/useApiQueries";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";

/** Falls back to downtown Milwaukee when nothing is geocoded yet. */
const MILWAUKEE_CENTER: [number, number] = [43.0389, -87.9065];

const GEOCODE_BATCH_SIZE = 10;

type PinnedLocation = Location & { latitude: number; longitude: number };

function hasCoordinates(location: Location): location is PinnedLocation {
  return location.latitude !== null && location.longitude !== null;
}

/**
 * Leaflet's bundled marker images break under Vite because the CSS references them by relative
 * path. A div icon sidesteps that entirely and lets the pin carry its rank and the theme colour.
 */
function rankIcon(rank: number) {
  return L.divIcon({
    className: "",
    html:
      `<div class="flex h-7 w-7 items-center justify-center rounded-full border-2 ` +
      `border-white bg-primary text-[11px] font-semibold text-primary-foreground shadow-md">` +
      `${rank}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

/** Frames the map on the pins whenever the set of pinned locations changes. */
function FitToPins({ pins }: { pins: PinnedLocation[] }) {
  const map = useMap();

  // Keyed on the coordinates themselves so dragging one pin does not refit the whole map on
  // every render, only when a position actually changes.
  const signature = pins
    .map((pin) => `${pin.id}:${pin.latitude},${pin.longitude}`)
    .join("|");

  useEffect(() => {
    if (pins.length === 0) return;

    const bounds = L.latLngBounds(
      pins.map((pin) => [pin.latitude, pin.longitude] as [number, number]),
    );

    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, signature]);

  return null;
}

export function LocationMap() {
  const queryClient = useQueryClient();
  const { data: locations, isLoading } = useLocations();

  const [isGeocoding, setIsGeocoding] = useState(false);
  const [progress, setProgress] = useState<GeocodeSummary | null>(null);

  const all = useMemo(() => locations ?? [], [locations]);
  const pins = useMemo(() => all.filter(hasCoordinates), [all]);
  const unmapped = useMemo(() => all.filter((l) => !hasCoordinates(l)), [all]);

  async function handleDragEnd(location: PinnedLocation, latLng: L.LatLng) {
    await api.setLocationCoordinates(location.id, latLng.lat, latLng.lng);
    queryClient.invalidateQueries({ queryKey: ["locations"] });
  }

  /**
   * Works through the un-geocoded locations a batch at a time. The server hands back how many are
   * still outstanding; a batch that resolves nothing means the remainder are addresses the
   * geocoder cannot match, so we stop rather than retry them forever.
   */
  async function runGeocoding() {
    setIsGeocoding(true);
    setProgress(null);

    try {
      for (;;) {
        const summary = await api.geocodeMissingLocations(GEOCODE_BATCH_SIZE);
        setProgress(summary);

        if (summary.processed === 0 || summary.geocoded === 0) break;
        if (summary.remaining === 0) break;
      }
    } finally {
      setIsGeocoding(false);
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          Location Map
          {!isLoading && (
            <>
              <Badge variant="secondary">{pins.length} mapped</Badge>
              {unmapped.length > 0 && (
                <Badge variant="outline">{unmapped.length} unmapped</Badge>
              )}
            </>
          )}
          {unmapped.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={runGeocoding}
              disabled={isGeocoding}
            >
              {isGeocoding ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Crosshair className="mr-2 h-4 w-4" />
              )}
              {isGeocoding ? "Geocoding..." : "Geocode addresses"}
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[520px] w-full" />
        ) : all.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MapPin className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No locations to map</p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-lg border border-border">
              <MapContainer
                center={MILWAUKEE_CENTER}
                zoom={12}
                scrollWheelZoom={false}
                style={{ height: "520px", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <FitToPins pins={pins} />

                {pins.map((location) => (
                  <Marker
                    key={location.id}
                    position={[location.latitude, location.longitude]}
                    icon={rankIcon(location.rank)}
                    draggable
                    eventHandlers={{
                      dragend: (event) =>
                        handleDragEnd(location, event.target.getLatLng()),
                    }}
                  >
                    <Popup>
                      <span className="block text-sm font-semibold">{location.name}</span>
                      <span className="block text-xs">{location.address}</span>
                      {location.description && (
                        <span className="mt-1 block text-xs opacity-70">
                          {location.description}
                        </span>
                      )}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              Drag a pin to correct its position. Corrections are saved immediately and are not
              overwritten by re-geocoding.
            </p>

            {progress && (
              <p className="mt-2 text-xs text-muted-foreground">
                Geocoded {progress.geocoded} of {progress.processed} in the last batch
                {progress.remaining > 0 && `, ${progress.remaining} still unmapped`}.
              </p>
            )}

            {unmapped.length > 0 && (
              <div className="mt-4 rounded-lg border border-border p-4">
                <p className="mb-2 text-sm font-medium text-foreground">
                  Not on the map ({unmapped.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {unmapped.map((location) => (
                    <Badge key={location.id} variant="outline" className="font-normal">
                      {location.name}
                    </Badge>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  These addresses could not be resolved. Give them a more specific address, or
                  drop a pin by editing the location.
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
