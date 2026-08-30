// Загрузчик API Яндекс.Карт. Скрипт подключаем один раз на всё приложение:
// вторая вставка того же тега молча ломает уже созданные карты.
//
// Ключ необязателен — API отвечает и без него, — но по условиям Яндекса он
// нужен. Если появится, положить в NEXT_PUBLIC_YANDEX_MAPS_KEY, и всё.

/* eslint-disable @typescript-eslint/no-explicit-any */
type YMaps = any;

declare global {
  interface Window {
    ymaps?: YMaps;
  }
}

const API_VERSION = "2.1";

let loading: Promise<YMaps> | null = null;

export function loadYandexMaps(): Promise<YMaps> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error(
        "Карту можно грузить только в браузере",
      ),
    );
  }

  if (loading) {
    return loading;
  }

  loading = new Promise<YMaps>(
    (resolve, reject) => {
      function whenReady() {
        window.ymaps.ready(() =>
          resolve(window.ymaps),
        );
      }

      if (window.ymaps) {
        whenReady();

        return;
      }

      const key =
        process.env
          .NEXT_PUBLIC_YANDEX_MAPS_KEY;

      const script =
        document.createElement("script");

      script.src = [
        `https://api-maps.yandex.ru/${API_VERSION}/?lang=ru_RU`,
        key ? `&apikey=${key}` : "",
      ].join("");

      script.async = true;

      script.onload = whenReady;

      script.onerror = () => {
        loading = null;

        reject(
          new Error(
            "Не удалось загрузить Яндекс.Карты",
          ),
        );
      };

      document.head.appendChild(script);
    },
  );

  return loading;
}
