"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { loadYandexMaps } from "@/lib/yandexMaps";
import type { Listing } from "@/types/listing";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface MapViewProps {
  listings: Listing[];
  hoveredId: number | null;
  onHover: (id: number | null) => void;
  onSelect: (id: number) => void;
}

const SPB_CENTER: [number, number] = [
  59.94, 30.32,
];

function pinTemplate(active: boolean) {
  const colors = active
    ? "background:#2a6f5b;color:#ffffff"
    : "background:#ffffff;color:#1c1b19";

  return (
    '<span style="' +
    colors +
    ';display:inline-flex;align-items:center;height:34px;padding:0 14px;' +
    'border-radius:20px;font:600 13px/1 Inter,system-ui,sans-serif;white-space:nowrap;' +
    'box-shadow:0 2px 6px rgba(0,0,0,0.16);cursor:pointer">$[properties.iconContent]</span>'
  );
}

export default function MapView({
  listings,
  hoveredId,
  onHover,
  onSelect,
}: MapViewProps) {
  const containerRef =
    useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const ymapsRef = useRef<any>(null);
  const placemarksRef = useRef(
    new Map<number, any>(),
  );
  const layoutsRef = useRef<{
    normal: any;
    active: any;
  } | null>(null);

  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const placemarks = placemarksRef.current;

    loadYandexMaps()
      .then((ymaps) => {
        if (
          cancelled ||
          !containerRef.current ||
          mapRef.current
        ) {
          return;
        }

        ymapsRef.current = ymaps;

        layoutsRef.current = {
          normal:
            ymaps.templateLayoutFactory.createClass(
              pinTemplate(false),
            ),
          active:
            ymaps.templateLayoutFactory.createClass(
              pinTemplate(true),
            ),
        };

        mapRef.current = new ymaps.Map(
          containerRef.current,
          {
            center: SPB_CENTER,
            zoom: 11,
            controls: ["zoomControl"],
          },
          {
            suppressMapOpenBlock: true,
          },
        );

        setReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
        }
      });

    return () => {
      cancelled = true;
      mapRef.current?.destroy();
      mapRef.current = null;
      placemarks.clear();
      setReady(false);
    };
  }, []);

  const applyLayout = useCallback(
    (placemark: any, active: boolean) => {
      const layouts = layoutsRef.current;

      if (!layouts) {
        return;
      }

      placemark.options.set({
        iconLayout: active
          ? layouts.active
          : layouts.normal,
        zIndex: active ? 1000 : 100,
      });
    },
    [],
  );

  // Метки пересобираем только когда сменился список, а не на каждый ререндер:
  // иначе карта моргает и теряет позицию.
  useEffect(() => {
    const ymaps = ymapsRef.current;
    const map = mapRef.current;
    const layouts = layoutsRef.current;

    if (!ready || !ymaps || !map || !layouts) {
      return;
    }

    map.geoObjects.removeAll();
    placemarksRef.current.clear();

    listings.forEach((listing) => {
      const placemark = new ymaps.Placemark(
        [listing.lat, listing.lng],
        {
          iconContent: `${listing.pricePerNight.toLocaleString("ru-RU")} ₽`,
          hintContent: listing.title,
        },
        {
          iconLayout: layouts.normal,
          iconShape: {
            type: "Rectangle",
            coordinates: [
              [-45, -17],
              [45, 17],
            ],
          },
          zIndex: 100,
        },
      );

      placemark.events.add(
        "mouseenter",
        () => onHover(listing.id),
      );

      placemark.events.add("mouseleave", () =>
        onHover(null),
      );

      placemark.events.add("click", () =>
        onSelect(listing.id),
      );

      map.geoObjects.add(placemark);
      placemarksRef.current.set(
        listing.id,
        placemark,
      );
    });

    if (listings.length > 0) {
      map.setBounds(
        map.geoObjects.getBounds(),
        {
          checkZoomRange: true,
          zoomMargin: 48,
        },
      );
    }
  }, [
    listings,
    ready,
    onHover,
    onSelect,
  ]);

  // Подсветка метки при наведении на карточку в списке.
  useEffect(() => {
    if (!ready) {
      return;
    }

    placemarksRef.current.forEach(
      (placemark, id) => {
        applyLayout(
          placemark,
          id === hoveredId,
        );
      },
    );
  }, [hoveredId, ready, applyLayout]);

  if (failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[var(--uyut-map)] px-6 text-center">
        <p className="m-0 max-w-[280px] text-[14px] leading-5 text-[var(--uyut-secondary)]">
          Карта не загрузилась. Список объявлений
          рядом работает как обычно.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label="Карта объявлений"
      className="h-full w-full bg-[var(--uyut-map)]"
    />
  );
}
