import { Router } from "express";

import {
  findListingById,
  getListings,
} from "../data/listings.js";
import { findReviewsByListing } from "../data/reviews.js";
import {
  filterListings,
  type CatalogQuery,
  type SortOption,
} from "../lib/filterListings.js";
import type {
  Amenity,
  HousingType,
} from "../data/listings.js";

const router = Router();

const housingTypes: HousingType[] = [
  "apartment",
  "studio",
  "room",
  "house",
];

const amenityList: Amenity[] = [
  "wifi",
  "kitchen",
  "parking",
  "washer",
  "tv",
  "ac",
  "pets",
];

const sortOptions: SortOption[] = [
  "price_asc",
  "price_desc",
  "rating_desc",
];

// Из строки запроса приходят строки, поэтому всё разбираем руками и отбрасываем мусор:
// на ?rooms=абв каталог должен просто игнорировать фильтр, а не падать.
function toNumber(value: unknown) {
  if (typeof value !== "string" || !value) {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : undefined;
}

function toList<T extends string>(
  value: unknown,
  allowed: T[],
) {
  if (typeof value !== "string" || !value) {
    return undefined;
  }

  const picked = value
    .split(",")
    .filter((item): item is T =>
      allowed.includes(item as T),
    );

  return picked.length > 0
    ? picked
    : undefined;
}

router.get("/", (req, res) => {
  const sortRaw = req.query.sort;

  const query: CatalogQuery = {
    city:
      typeof req.query.city === "string" &&
      req.query.city
        ? req.query.city
        : undefined,
    guests: toNumber(req.query.guests),
    priceMin: toNumber(req.query.priceMin),
    priceMax: toNumber(req.query.priceMax),
    rooms: toNumber(req.query.rooms),
    type: toList(
      req.query.type,
      housingTypes,
    ),
    amenities: toList(
      req.query.amenities,
      amenityList,
    ),
    sort:
      typeof sortRaw === "string" &&
      sortOptions.includes(
        sortRaw as SortOption,
      )
        ? (sortRaw as SortOption)
        : undefined,
    page: toNumber(req.query.page),
    limit: toNumber(req.query.limit),
  };

  res.json(
  filterListings(
    getListings(),
    query,
  ),
);
});

router.get("/:id/reviews", (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({
      error: "INVALID_ID",
      message: "Некорректный идентификатор",
    });

    return;
  }

  res.json({ items: findReviewsByListing(id) });
});

router.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  const listing = findListingById(id);

  if (!listing) {
    res.status(404).json({
      error: "NOT_FOUND",
      message: "Объявление не найдено",
    });

    return;
  }

  res.json(listing);
});

export default router;
