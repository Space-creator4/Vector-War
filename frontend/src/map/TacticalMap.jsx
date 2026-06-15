import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import { DEFAULT_CENTER } from "../../../shared/constants/game.js";
import { relationClass, unitSymbol } from "../icons/unitIcons.js";

export default function TacticalMap({ units, selectedUnitId, onSelectUnit, onMapCommand }) {
  const mapRef = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    if (mapRef.current) return;
    const map = L.map("tactical-map", {
      center: [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng],
      zoom: 9,
      zoomControl: false
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      keepBuffer: 2,
      updateWhenIdle: true,
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);

    map.on("click", (event) => onMapCommand?.({ lat: event.latlng.lat, lng: event.latlng.lng }));
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);
  }, [onMapCommand]);

  const markers = useMemo(() => units ?? [], [units]);

  useEffect(() => {
    if (!layerRef.current) return;
    layerRef.current.clearLayers();

    for (const unit of markers) {
      const marker = L.marker([Number(unit.lat), Number(unit.lng)], {
        icon: L.divIcon({
          className: `unit-marker ${relationClass(unit.relation)} ${unit.unit_id === selectedUnitId ? "selected" : ""}`,
          html: `<span>${unitSymbol(unit.type)}</span>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        })
      });
      marker.on("click", (event) => {
        event.originalEvent.stopPropagation();
        onSelectUnit(unit);
      });
      marker.addTo(layerRef.current);
    }
  }, [markers, onSelectUnit, selectedUnitId]);

  return <div id="tactical-map" aria-label="Tactical OpenStreetMap" />;
}
