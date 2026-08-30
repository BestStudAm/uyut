"use client";

import { useEffect, useRef, useState } from "react";

import { loadYandexMaps } from "@/lib/yandexMaps";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface ListingMapProps {
  lat: number;
  lng: number;
  title: string;
  district: string;
}

export default function ListingMap({
  lat,
  lng,
  title,
  district,
}: ListingMapProps) {
  const containerRef =
    useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadYandexMaps()
      .then((ymaps) => {
        if (
          cancelled ||
          !containerRef.current ||
          mapRef.current
        ) {
          return;
        }

        const map = new ymaps.Map(
          containerRef.current,
          {
            center: [lat, lng],
            zoom: 15,
            controls: ["zoomControl"],
          },
          {
            suppressMapOpenBlock: true,
          },
        );

        // Скролл страницы важнее зума: иначе пользователь пытается пролистать
        // карточку, а вместо этого приближает карту.
        map.behaviors.disable("scrollZoom");

        const layout =
          ymaps.templateLayoutFactory.createClass(
            '<span style="display:block;width:16px;height:16px;border-radius:50%;' +
              "background:#2a6f5b;border:3px solid #ffffff;" +
              'box-shadow:0 0 0 2px rgba(42,111,91,0.35)"></span>',
          );

        map.geoObjects.add(
          new ymaps.Placemark(
            [lat, lng],
            { hintContent: title },
            {
              iconLayout: layout,
              iconShape: {
                type: "Circle",
                coordinates: [0, 0],
                radius: 10,
              },
            },
          ),
        );

        mapRef.current = map;
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
    };
  }, [lat, lng, title]);

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

      {failed ? (
        <p className="mt-4 text-[15px] leading-6 text-[var(--uyut-secondary)]">
          Карта не загрузилась.
        </p>
      ) : (
        <div
          ref={containerRef}
          role="application"
          aria-label={`Карта: ${title}`}
          className="mt-4 h-[320px] w-full overflow-hidden rounded-[12px] bg-[var(--uyut-map)]"
        />
      )}
    </div>
  );
}
