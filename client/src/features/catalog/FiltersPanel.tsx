"use client";

import { useState } from "react";

import Button from "@/components/Button";
import Input from "@/components/Input";
import {
  amenityLabels,
  housingTypeLabels,
  type Amenity,
  type HousingType,
} from "@/types/listing";

import type { CatalogFilters } from "./catalogParams";

interface FiltersPanelProps {
  filters: CatalogFilters;
  onApply: (next: Partial<CatalogFilters>) => void;
  onReset: () => void;
  onClose?: () => void;
}

const types = Object.keys(
  housingTypeLabels,
) as HousingType[];

const amenities = Object.keys(
  amenityLabels,
) as Amenity[];

const roomOptions = [1, 2, 3, 4];

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

export default function FiltersPanel({
  filters,
  onApply,
  onReset,
  onClose,
}: FiltersPanelProps) {
  // Черновик правок: пользователь щёлкает чекбоксы, а запрос уходит только по кнопке.
  // Иначе на каждый клик летит запрос и выдача мигает. Синхронизировать черновик
  // с пропсами не нужно: родитель пересоздаёт панель по key, когда фильтры сменились.
  const [draft, setDraft] =
    useState<CatalogFilters>(filters);

  function apply() {
    onApply({
      priceMin: draft.priceMin,
      priceMax: draft.priceMax,
      rooms: draft.rooms,
      type: draft.type,
      amenities: draft.amenities,
    });

    onClose?.();
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto">
        <section className="flex flex-col gap-3">
          <h3 className="m-0 text-[16px] font-semibold text-[#1c1b19]">
            Цена за ночь
          </h3>

          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={0}
              step={500}
              placeholder="от"
              aria-label="Цена от"
              value={draft.priceMin ?? ""}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  priceMin:
                    Number(event.target.value) ||
                    undefined,
                }))
              }
            />

            <span className="text-[var(--uyut-muted)]">
              —
            </span>

            <Input
              type="number"
              min={0}
              step={500}
              placeholder="до"
              aria-label="Цена до"
              value={draft.priceMax ?? ""}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  priceMax:
                    Number(event.target.value) ||
                    undefined,
                }))
              }
            />
          </div>
        </section>

        <section className="flex flex-col gap-3 border-t border-[var(--uyut-border)] pt-6">
          <h3 className="m-0 text-[16px] font-semibold text-[#1c1b19]">
            Тип жилья
          </h3>

          <div className="flex flex-col gap-2.5">
            {types.map((type) => (
              <label
                key={type}
                className="flex cursor-pointer items-center gap-2.5 text-[15px] text-[#1c1b19]"
              >
                <input
                  type="checkbox"
                  checked={draft.type.includes(type)}
                  onChange={() =>
                    setDraft((prev) => ({
                      ...prev,
                      type: toggle(prev.type, type),
                    }))
                  }
                  className="size-5 accent-[#2a6f5b]"
                />

                {housingTypeLabels[type]}
              </label>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3 border-t border-[var(--uyut-border)] pt-6">
          <h3 className="m-0 text-[16px] font-semibold text-[#1c1b19]">
            Комнат от
          </h3>

          <div className="flex gap-2">
            {roomOptions.map((rooms) => {
              const active = draft.rooms === rooms;

              return (
                <button
                  key={rooms}
                  type="button"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      rooms: active
                        ? undefined
                        : rooms,
                    }))
                  }
                  className={[
                    "h-10 flex-1 rounded-[10px] border text-[15px] font-medium transition-colors",
                    active
                      ? "border-[#2a6f5b] bg-[var(--uyut-green-light)] text-[#2a6f5b]"
                      : "border-[var(--uyut-border)] bg-white text-[#1c1b19] hover:bg-[#f7f5f2]",
                  ].join(" ")}
                >
                  {rooms === 4 ? "4+" : rooms}
                </button>
              );
            })}
          </div>
        </section>

        <section className="flex flex-col gap-3 border-t border-[var(--uyut-border)] pt-6">
          <h3 className="m-0 text-[16px] font-semibold text-[#1c1b19]">
            Удобства
          </h3>

          <div className="flex flex-col gap-2.5">
            {amenities.map((amenity) => (
              <label
                key={amenity}
                className="flex cursor-pointer items-center gap-2.5 text-[15px] text-[#1c1b19]"
              >
                <input
                  type="checkbox"
                  checked={draft.amenities.includes(
                    amenity,
                  )}
                  onChange={() =>
                    setDraft((prev) => ({
                      ...prev,
                      amenities: toggle(
                        prev.amenities,
                        amenity,
                      ),
                    }))
                  }
                  className="size-5 accent-[#2a6f5b]"
                />

                {amenityLabels[amenity]}
              </label>
            ))}
          </div>
        </section>
      </div>

      <div className="flex flex-col gap-2 border-t border-[var(--uyut-border)] pt-5">
        <Button
          type="button"
          size="lg"
          fullWidth
          onClick={apply}
        >
          Применить
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            onReset();
            onClose?.();
          }}
        >
          Сбросить фильтры
        </Button>
      </div>
    </div>
  );
}
