"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import "leaflet/dist/leaflet.css";

import type { Listing } from "@/types/listing";

interface MapViewProps {
  listings: Listing[];
  hoveredId: number | null;
  onHover: (id: number | null) => void;
  onSelect: (id: number) => void;
}

// Leaflet трогает window прямо при импорте, поэтому подгружаем его внутри эффекта,
// а не сверху файла: иначе страница падает на серверном рендере Next.
type Leaflet = typeof import("leaflet");
type LeafletMap = import("leaflet").Map;
type LeafletMarker = import("leaflet").Marker;

const SPB_CENTER: [number, number] = [
  59.94, 30.32,
];

function pinHtml(
  price: number,
  active: boolean,
) {
  const label = `${price.toLocaleString("ru-RU")} ₽`;

  return `<span class="${
    active
      ? "bg-[#2a6f5b] text-white"
      : "bg-white text-[#1c1b19]"
  } inline-flex h-[34px] cursor-pointer items-center rounded-[20px] px-3.5 text-[13px] font-semibold shadow-[0_2px_6px_rgba(0,0,0,0.16)] whitespace-nowrap">${label}</span>`;
}

export default function MapView({
  listings,
  hoveredId,
  onHover,
  onSelect,
}: MapViewProps) {
  const containerRef =
    useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<Leaflet | null>(
    null,
  );
  const markersRef = useRef(
    new Map<number, LeafletMarker>(),
  );

  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Копию держим локально: к моменту очистки markersRef.current уже другой.
    const markers = markersRef.current;

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

      leafletRef.current = L;

      const map = L.map(containerRef.current, {
        center: SPB_CENTER,
        zoom: 11,
        zoomControl: true,
      });

      L.tileLayer(
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 19,
          attribution:
            '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        },
      ).addTo(map);

      mapRef.current = map;
      setReady(true);
    }

    init();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markers.clear();
      setReady(false);
    };
  }, []);

  const makeIcon = useCallback(
    (listing: Listing, active: boolean) => {
      const L = leafletRef.current;

      if (!L) {
        return undefined;
      }

      return L.divIcon({
        className: "uyut-pin",
        html: pinHtml(
          listing.pricePerNight,
          active,
        ),
        iconSize: undefined,
        iconAnchor: [40, 17],
      });
    },
    [],
  );

  // Метки пересобираем только когда сменился список, а не на каждый ререндер:
  // иначе карта моргает и сбрасывает позицию.
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;

    if (!ready || !L || !map) {
      return;
    }

    markersRef.current.forEach((marker) =>
      marker.remove(),
    );
    markersRef.current.clear();

    listings.forEach((listing) => {
      const icon = makeIcon(listing, false);

      if (!icon) {
        return;
      }

      const marker = L.marker(
        [listing.lat, listing.lng],
        { icon },
      )
        .addTo(map)
        .bindPopup(
          `<strong>${listing.title}</strong><br>${listing.district} район`,
        );

      marker.on("mouseover", () =>
        onHover(listing.id),
      );
      marker.on("mouseout", () =>
        onHover(null),
      );
      marker.on("click", () =>
        onSelect(listing.id),
      );

      markersRef.current.set(
        listing.id,
        marker,
      );
    });

    if (listings.length > 0) {
      map.fitBounds(
        listings.map((listing) => [
          listing.lat,
          listing.lng,
        ]),
        { padding: [48, 48], maxZoom: 14 },
      );
    }
  }, [listings, ready, makeIcon, onHover, onSelect]);

  // Подсветка метки при наведении на карточку в списке.
  useEffect(() => {
    if (!ready) {
      return;
    }

    markersRef.current.forEach(
      (marker, id) => {
        const listing = listings.find(
          (item) => item.id === id,
        );

        if (!listing) {
          return;
        }

        const icon = makeIcon(
          listing,
          id === hoveredId,
        );

        if (icon) {
          marker.setIcon(icon);
          marker.setZIndexOffset(
            id === hoveredId ? 1000 : 0,
          );
        }
      },
    );
  }, [hoveredId, listings, ready, makeIcon]);

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label="Карта объявлений"
      className="h-full w-full bg-[var(--uyut-map)]"
    />
  );
}
