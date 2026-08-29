"use client";

import { useEffect, useRef } from "react";

import "leaflet/dist/leaflet.css";

interface ListingMapProps {
  lat: number;
  lng: number;
  title: string;
  district: string;
}

// Leaflet обращается к window прямо при импорте, поэтому грузим его внутри
// эффекта — иначе страница падает на серверном рендере Next.
type LeafletMap = import("leaflet").Map;

export default function ListingMap({
  lat,
  lng,
  title,
  district,
}: ListingMapProps) {
  const containerRef =
    useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const L = (await import("leaflet"))
        .default;

      if (
        cancelled ||
        !containerRef.current ||
        mapRef.current
      ) {
        return;
      }

      const map = L.map(containerRef.current, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      L.tileLayer(
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 19,
          attribution:
            '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        },
      ).addTo(map);

      L.marker([lat, lng], {
        icon: L.divIcon({
          className: "uyut-listing-pin",
          html: '<span class="block h-4 w-4 rounded-full border-[3px] border-white bg-[#2a6f5b] shadow-[0_0_0_2px_rgba(42,111,91,0.35)]"></span>',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        }),
      })
        .addTo(map)
        .bindPopup(
          `<strong>${title}</strong><br>${district} район`,
        );

      mapRef.current = map;
    }

    init();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [lat, lng, title, district]);

  return (
    <div className="mt-8">
      <h2 className="m-0 text-[22px] font-semibold text-[#1c1b19]">
        Где находится
      </h2>

      <p className="mt-2 text-[15px] leading-6 text-[#6b6560]">
        {district} район, Санкт-Петербург.
        Точный адрес хозяин присылает после
        подтверждения брони.
      </p>

      <div
        ref={containerRef}
        role="application"
        aria-label={`Карта: ${title}`}
        className="mt-4 h-[320px] w-full overflow-hidden rounded-[12px] bg-[var(--uyut-map)]"
      />
    </div>
  );
}
