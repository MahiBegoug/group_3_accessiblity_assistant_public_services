import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import type { Bounds, MapMarker } from "../types";

const MONTREAL_CENTER: [number, number] = [45.5019, -73.5674];

function makeIcon(accessible: boolean, active: boolean): L.DivIcon {
  const color = accessible ? "#12a150" : "#2f6df6";
  const size = active ? 34 : 26;
  const ring = active
    ? "box-shadow:0 0 0 6px rgba(47,109,246,0.25);"
    : "box-shadow:0 3px 8px rgba(16,24,40,0.28);";
  return L.divIcon({
    className: "ez-marker",
    html: `<span style="display:block;width:${size}px;height:${size}px;background:${color};border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);${ring}"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

function FitBounds({ bounds, active }: { bounds: Bounds | null; active: MapMarker | null }) {
  const map = useMap();

  useEffect(() => {
    if (active) {
      map.flyTo([active.latitude, active.longitude], 15, { duration: 0.8 });
    }
  }, [active, map]);

  useEffect(() => {
    if (active) return;
    if (bounds) {
      map.flyToBounds(
        [
          [bounds.south, bounds.west],
          [bounds.north, bounds.east],
        ],
        { padding: [48, 48], duration: 0.8, maxZoom: 15 }
      );
    }
  }, [bounds, active, map]);

  return null;
}

interface MapViewProps {
  markers: MapMarker[];
  bounds: Bounds | null;
  activeId: string | null;
  onMarkerClick: (id: string) => void;
}

export function MapView({ markers, bounds, activeId, onMarkerClick }: MapViewProps) {
  const active = markers.find((m) => m.id === activeId) ?? null;

  return (
    <section className="panel map-panel" aria-label="Map of places">
      {markers.length > 0 && (
        <div className="map-badge">{markers.length} on map</div>
      )}
      {markers.length === 0 && (
        <div className="map-empty">
          Locations you search for will appear here on an interactive map.
        </div>
      )}
      <MapContainer
        center={MONTREAL_CENTER}
        zoom={11}
        scrollWheelZoom
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.latitude, marker.longitude]}
            icon={makeIcon(marker.accessible, marker.id === activeId)}
            eventHandlers={{ click: () => onMarkerClick(marker.id) }}
          >
            <Popup>
              <div className="popup__name">{marker.name}</div>
              <div className="popup__meta">{marker.shortSummary}</div>
            </Popup>
          </Marker>
        ))}
        <FitBounds bounds={bounds} active={active} />
      </MapContainer>
    </section>
  );
}
