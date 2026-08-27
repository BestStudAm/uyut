import { describe, expect, it } from "vitest";

import {
  buildApiQuery,
  buildSearch,
  countActiveFilters,
  emptyFilters,
  parseFilters,
} from "./catalogParams";

describe("параметры каталога", () => {
  it("не пишет в адрес пустые значения", () => {
    expect(buildSearch(emptyFilters)).toBe("");
  });

  it("собирает и разбирает фильтры без потерь", () => {
    const filters = {
      ...emptyFilters,
      city: "Санкт-Петербург",
      guests: 4,
      priceMin: 3000,
      priceMax: 8000,
      rooms: 2,
      type: ["apartment", "studio"] as const,
      amenities: ["wifi", "parking"] as const,
      sort: "price_asc" as const,
      page: 3,
    };

    const restored = parseFilters(
      new URLSearchParams(
        buildSearch({
          ...filters,
          type: [...filters.type],
          amenities: [...filters.amenities],
        }),
      ),
    );

    expect(restored).toEqual({
      ...filters,
      type: [...filters.type],
      amenities: [...filters.amenities],
      checkIn: undefined,
      checkOut: undefined,
    });
  });

  it("игнорирует мусор в адресе вместо того, чтобы падать", () => {
    const filters = parseFilters(
      new URLSearchParams(
        "guests=абв&rooms=-2&type=замок&sort=по_настроению&amenities=wifi,телепорт",
      ),
    );

    expect(filters.guests).toBeUndefined();
    expect(filters.rooms).toBeUndefined();
    expect(filters.type).toEqual([]);
    expect(filters.sort).toBeUndefined();
    expect(filters.amenities).toEqual(["wifi"]);
  });

  it("первую страницу в адрес не пишет", () => {
    expect(
      buildSearch({ ...emptyFilters, page: 1 }),
    ).toBe("");

    expect(
      buildSearch({ ...emptyFilters, page: 2 }),
    ).toBe("page=2");
  });

  it("сохраняет даты в адресе, но не шлёт их в API", () => {
    const filters = {
      ...emptyFilters,
      city: "Санкт-Петербург",
      checkIn: "2026-09-12",
      checkOut: "2026-09-15",
    };

    expect(buildSearch(filters)).toContain(
      "checkIn=2026-09-12",
    );

    const apiQuery = buildApiQuery(filters, 12);

    expect(apiQuery).not.toContain("checkIn");
    expect(apiQuery).toContain("limit=12");
  });

  it("считает только те фильтры, что задал пользователь", () => {
    expect(
      countActiveFilters(emptyFilters),
    ).toBe(0);

    expect(
      countActiveFilters({
        ...emptyFilters,
        city: "Санкт-Петербург",
        guests: 2,
        priceMin: 3000,
        amenities: ["wifi"],
      }),
    ).toBe(2);
  });
});
