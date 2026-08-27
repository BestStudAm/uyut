"use client";

import { useEffect, useState } from "react";

import Modal from "@/components/Modal";
import { apiGet } from "@/lib/api";
import { plural } from "@/lib/plural";
import type {
  Listing,
  ListingsResponse,
} from "@/types/listing";

import FiltersPanel from "./FiltersPanel";
import ListingsGrid from "./ListingsGrid";
import MapView from "./MapView";
import MobileViewToggle from "./MobileViewToggle";
import SortSelect from "./SortSelect";
import {
  buildApiQuery,
  countActiveFilters,
} from "./catalogParams";
import { useCatalogParams } from "./useCatalogParams";

const PAGE_SIZE = 12;

function formatDate(value: string) {
  const [year, month, day] = value
    .split("-")
    .map(Number);

  return new Date(
    year,
    month - 1,
    day,
  ).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
}

function subtitle(
  total: number,
  checkIn?: string,
  checkOut?: string,
  guests?: number,
) {
  const parts = [
    `${total} ${plural(total, [
      "вариант",
      "варианта",
      "вариантов",
    ])}`,
  ];

  if (checkIn && checkOut) {
    parts.push(
      `${formatDate(checkIn)} — ${formatDate(checkOut)}`,
    );
  }

  if (guests) {
    parts.push(
      `${guests} ${plural(guests, [
        "гость",
        "гостя",
        "гостей",
      ])}`,
    );
  }

  return parts.join(" · ");
}

export default function CatalogPage() {
  const { filters, setFilters, resetFilters } =
    useCatalogParams();

  // Храним вместе с данными запрос, который их принёс. Тогда «идёт загрузка»
  // вычисляется сравнением, а не отдельным setState внутри эффекта.
  const [result, setResult] = useState<{
    query: string | null;
    items: Listing[];
    total: number;
  }>({ query: null, items: [], total: 0 });

  const [error, setError] = useState<{
    query: string;
    message: string;
  } | null>(null);
  const [hoveredId, setHoveredId] = useState<
    number | null
  >(null);
  const [view, setView] = useState<
    "list" | "map"
  >("list");
  const [filtersOpen, setFiltersOpen] =
    useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const query = buildApiQuery(
    filters,
    PAGE_SIZE,
  );
  const page = filters.page;

  const items = result.items;
  const total = result.total;
  const currentError =
    error?.query === query ? error.message : null;
  const loading =
    result.query !== query && currentError === null;

  useEffect(() => {
    const controller = new AbortController();

    apiGet<ListingsResponse>(
      `/listings?${query}`,
      controller.signal,
    )
      .then((data) => {
        setResult((prev) => ({
          query,
          total: data.total,
          // Первая страница заменяет выдачу, следующие — дописывают.
          items:
            data.page > 1
              ? [...prev.items, ...data.items]
              : data.items,
        }));
      })
      .catch((cause: unknown) => {
        if (
          cause instanceof DOMException &&
          cause.name === "AbortError"
        ) {
          return;
        }

        setError({
          query,
          message:
            cause instanceof Error
              ? cause.message
              : "Неизвестная ошибка",
        });
      });

    return () => controller.abort();
  }, [query, reloadKey]);

  const activeFilters =
    countActiveFilters(filters);

  const filtersPanel = (
    <FiltersPanel
      key={query}
      filters={filters}
      onApply={setFilters}
      onReset={resetFilters}
      onClose={() => setFiltersOpen(false)}
    />
  );

  return (
    <div className="flex h-[calc(100vh-72px)] flex-col lg:flex-row">
      {/* Левая колонка: заголовок, фильтры, список */}
      <div
        className={[
          "flex min-w-0 flex-1 flex-col overflow-y-auto",
          view === "map"
            ? "hidden lg:flex"
            : "flex",
        ].join(" ")}
      >
        <div className="flex flex-col gap-6 px-5 py-8 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-1">
            <h1 className="m-0 text-[24px] font-semibold leading-8 text-[#1c1b19] sm:text-[28px]">
              {filters.city ?? "Все города"}
            </h1>

            <p className="m-0 text-[14px] leading-5 text-[var(--uyut-secondary)]">
              {subtitle(
                total,
                filters.checkIn,
                filters.checkOut,
                filters.guests,
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() =>
                setFiltersOpen((open) => !open)
              }
              className={[
                "h-9 rounded-[20px] border px-4 text-[14px] font-medium transition-colors",
                activeFilters > 0
                  ? "border-[#2a6f5b] bg-[var(--uyut-green-light)] text-[#2a6f5b]"
                  : "border-[var(--uyut-border)] bg-white text-[#1c1b19] hover:bg-[#f7f5f2]",
              ].join(" ")}
            >
              Фильтры
              {activeFilters > 0
                ? ` · ${activeFilters}`
                : ""}
            </button>

            <SortSelect
              value={filters.sort}
              onChange={(sort) =>
                setFilters({ sort })
              }
            />
          </div>

          <ListingsGrid
            listings={items}
            total={total}
            loading={loading}
            error={currentError}
            hoveredId={hoveredId}
            onHover={setHoveredId}
            onRetry={() => {
              setError(null);
              setReloadKey((key) => key + 1);
            }}
            onResetFilters={resetFilters}
            onShowMore={() =>
              setFilters({ page: page + 1 })
            }
            hasMore={
              items.length < total &&
              currentError === null
            }
          />
        </div>
      </div>

      {/* Панель фильтров: сбоку на десктопе, окном на телефоне */}
      {filtersOpen && (
        <aside className="hidden w-[320px] shrink-0 overflow-y-auto border-l border-[var(--uyut-border)] px-6 py-8 lg:block">
          {filtersPanel}
        </aside>
      )}

      <div className="lg:hidden">
        <Modal
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          title="Фильтры"
        >
          {filtersPanel}
        </Modal>
      </div>

      {/* Карта */}
      <div
        className={[
          "shrink-0 lg:block lg:w-[42%] lg:max-w-[620px]",
          view === "map"
            ? "flex-1"
            : "hidden",
        ].join(" ")}
      >
        <MapView
          listings={items}
          hoveredId={hoveredId}
          onHover={setHoveredId}
        />
      </div>

      <MobileViewToggle
        view={view}
        onChange={setView}
      />
    </div>
  );
}
