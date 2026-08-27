import type {
  Amenity,
  HousingType,
  Listing,
} from "../data/listings.js";

export type SortOption =
  | "price_asc"
  | "price_desc"
  | "rating_desc";

export interface CatalogQuery {
  city?: string;
  guests?: number;
  priceMin?: number;
  priceMax?: number;
  type?: HousingType[];
  rooms?: number;
  amenities?: Amenity[];
  sort?: SortOption;
  page?: number;
  limit?: number;
}

export const DEFAULT_LIMIT = 12;

// Комнаты в фильтре работают как «столько или больше»: кнопка 4+ должна показывать
// и четырёхкомнатные, и пятикомнатные.
function matches(
  listing: Listing,
  query: CatalogQuery,
) {
  if (
    query.city &&
    listing.city !== query.city
  ) {
    return false;
  }

  if (
    query.guests &&
    listing.guests < query.guests
  ) {
    return false;
  }

  if (
    query.priceMin !== undefined &&
    listing.pricePerNight < query.priceMin
  ) {
    return false;
  }

  if (
    query.priceMax !== undefined &&
    listing.pricePerNight > query.priceMax
  ) {
    return false;
  }

  if (
    query.type &&
    query.type.length > 0 &&
    !query.type.includes(listing.type)
  ) {
    return false;
  }

  if (
    query.rooms &&
    listing.rooms < query.rooms
  ) {
    return false;
  }

  if (query.amenities) {
    const hasAll = query.amenities.every(
      (amenity) =>
        listing.amenities.includes(amenity),
    );

    if (!hasAll) {
      return false;
    }
  }

  return true;
}

function compare(sort: SortOption | undefined) {
  return (a: Listing, b: Listing) => {
    if (sort === "price_asc") {
      return a.pricePerNight - b.pricePerNight;
    }

    if (sort === "price_desc") {
      return b.pricePerNight - a.pricePerNight;
    }

    if (sort === "rating_desc") {
      return b.rating - a.rating;
    }

    return a.id - b.id;
  };
}

export function filterListings(
  source: Listing[],
  query: CatalogQuery,
) {
  const found = source
    .filter((listing) =>
      matches(listing, query),
    )
    .sort(compare(query.sort));

  const limit = query.limit ?? DEFAULT_LIMIT;
  const page = query.page ?? 1;
  const start = (page - 1) * limit;

  return {
    items: found.slice(start, start + limit),
    total: found.length,
    page,
    limit,
  };
}
