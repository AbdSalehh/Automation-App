"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

interface LocationMapProps {
  latitude: number;
  longitude: number;
}

export function LocationMap({ latitude, longitude }: LocationMapProps) {
  const containerReference = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerReference.current;

    if (!container) {
      return;
    }

    let isDisposed = false;
    let map: import("leaflet").Map | null = null;

    void import("leaflet").then((leaflet) => {
      if (isDisposed) {
        return;
      }

      map = leaflet.map(container, {
        attributionControl: true,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        zoomControl: false,
        touchZoom: false,
      }).setView([latitude, longitude], 15);

      leaflet
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap",
          maxZoom: 19,
        })
        .addTo(map);

      leaflet
        .circleMarker([latitude, longitude], {
          radius: 9,
          color: "#ffffff",
          weight: 3,
          fillColor: "#f43f5e",
          fillOpacity: 1,
        })
        .addTo(map);
    });

    return () => {
      isDisposed = true;
      map?.remove();
    };
  }, [latitude, longitude]);

  return <div ref={containerReference} className="h-36 w-full bg-slate-800" />;
}
