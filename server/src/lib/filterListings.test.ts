import { describe, expect, it } from "vitest";

import {
  filterListings,
} from "./filterListings.js";
import type { Listing } from "../data/listings.js";

function make(
  id: number,
  overrides: Partial<Listing> = {},
): Listing {
  return {
    id,
    title: `Объект ${id}`,
    city: "Санкт-Петербург",
    district: "Центральный",
    type: "apartment",
    pricePerNight: 5000,
    rating: 4.5,
    reviewsCount: 10,
    guests: 2,
    rooms: 1,
    area: 40,
    amenities: ["wifi"],
    lat: 59.93,
    lng: 30.35,
    ...overrides,
  };
}

describe("фильтрация каталога", () => {
  it("отбирает по вилке цены", () => {
    const source = [
      make(1, { pricePerNight: 3000 }),
      make(2, { pricePerNight: 5000 }),
      make(3, { pricePerNight: 9000 }),
    ];

    const result = filterListings(source, {
      priceMin: 4000,
      priceMax: 6000,
    });

    expect(result.total).toBe(1);
    expect(result.items[0].id).toBe(2);
  });

  it("считает комнаты как «столько или больше»", () => {
    const source = [
      make(1, { rooms: 1 }),
      make(2, { rooms: 4 }),
      make(3, { rooms: 5 }),
    ];

    const result = filterListings(source, {
      rooms: 4,
    });

    expect(
      result.items.map((item) => item.id),
    ).toEqual([2, 3]);
  });

  it("требует все выбранные удобства сразу, а не любое из них", () => {
    const source = [
      make(1, { amenities: ["wifi"] }),
      make(2, {
        amenities: ["wifi", "parking"],
      }),
    ];

    const result = filterListings(source, {
      amenities: ["wifi", "parking"],
    });

    expect(result.total).toBe(1);
    expect(result.items[0].id).toBe(2);
  });

  it("не теряет объекты, где гостей больше запрошенного", () => {
    const source = [
      make(1, { guests: 2 }),
      make(2, { guests: 6 }),
    ];

    const result = filterListings(source, {
      guests: 4,
    });

    expect(result.total).toBe(1);
    expect(result.items[0].id).toBe(2);
  });

  it("сортирует по цене и по рейтингу", () => {
    const source = [
      make(1, {
        pricePerNight: 9000,
        rating: 4.1,
      }),
      make(2, {
        pricePerNight: 3000,
        rating: 4.9,
      }),
    ];

    expect(
      filterListings(source, {
        sort: "price_asc",
      }).items[0].id,
    ).toBe(2);

    expect(
      filterListings(source, {
        sort: "price_desc",
      }).items[0].id,
    ).toBe(1);

    expect(
      filterListings(source, {
        sort: "rating_desc",
      }).items[0].id,
    ).toBe(2);
  });

  it("режет выдачу на страницы и отдаёт общее число найденных", () => {
    const source = Array.from(
      { length: 25 },
      (_, index) => make(index + 1),
    );

    const page2 = filterListings(source, {
      page: 2,
      limit: 10,
    });

    expect(page2.total).toBe(25);
    expect(page2.items).toHaveLength(10);
    expect(page2.items[0].id).toBe(11);
  });
});
