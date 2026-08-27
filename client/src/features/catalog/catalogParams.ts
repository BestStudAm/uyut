// Состояние поиска живёт в адресе страницы, а не в useState. Так ссылку на выдачу
// можно переслать, и она откроется в том же виде. Имена параметров те же,
// что ставит поиск в шапке: city, guests, checkIn, checkOut.

import type {
  Amenity,
  HousingType,
} from "@/types/listing";

export type SortOption =
  | "price_asc"
  | "price_desc"
  | "rating_desc";

export interface CatalogFilters {
  city?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  priceMin?: number;
  priceMax?: number;
  type: HousingType[];
  rooms?: number;
  amenities: Amenity[];
  sort?: SortOption;
  page: number;
}

export const emptyFilters: CatalogFilters = {
  type: [],
  amenities: [],
  page: 1,
};

const housingTypes: HousingType[] = [
  "apartment",
  "studio",
  "room",
  "house",
];

const amenities: Amenity[] = [
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

function readNumber(
  params: URLSearchParams,
  key: string,
) {
  const raw = params.get(key);

  if (!raw) {
    return undefined;
  }

  const value = Number(raw);

  return Number.isFinite(value) && value > 0
    ? value
    : undefined;
}

function readList<T extends string>(
  params: URLSearchParams,
  key: string,
  allowed: T[],
): T[] {
  const raw = params.get(key);

  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .filter((item): item is T =>
      allowed.includes(item as T),
    );
}

export function parseFilters(
  params: URLSearchParams,
): CatalogFilters {
  const sort = params.get("sort");

  return {
    city: params.get("city") ?? undefined,
    checkIn:
      params.get("checkIn") ?? undefined,
    checkOut:
      params.get("checkOut") ?? undefined,
    guests: readNumber(params, "guests"),
    priceMin: readNumber(params, "priceMin"),
    priceMax: readNumber(params, "priceMax"),
    rooms: readNumber(params, "rooms"),
    type: readList(
      params,
      "type",
      housingTypes,
    ),
    amenities: readList(
      params,
      "amenities",
      amenities,
    ),
    sort:
      sort &&
      sortOptions.includes(sort as SortOption)
        ? (sort as SortOption)
        : undefined,
    page: readNumber(params, "page") ?? 1,
  };
}

// Пустые значения в адрес не пишем, иначе ссылка распухает и в ней ничего не разобрать.
export function buildSearch(
  filters: CatalogFilters,
): string {
  const params = new URLSearchParams();

  if (filters.city) {
    params.set("city", filters.city);
  }

  if (filters.checkIn) {
    params.set("checkIn", filters.checkIn);
  }

  if (filters.checkOut) {
    params.set("checkOut", filters.checkOut);
  }

  if (filters.guests) {
    params.set(
      "guests",
      String(filters.guests),
    );
  }

  if (filters.priceMin) {
    params.set(
      "priceMin",
      String(filters.priceMin),
    );
  }

  if (filters.priceMax) {
    params.set(
      "priceMax",
      String(filters.priceMax),
    );
  }

  if (filters.rooms) {
    params.set("rooms", String(filters.rooms));
  }

  if (filters.type.length > 0) {
    params.set("type", filters.type.join(","));
  }

  if (filters.amenities.length > 0) {
    params.set(
      "amenities",
      filters.amenities.join(","),
    );
  }

  if (filters.sort) {
    params.set("sort", filters.sort);
  }

  if (filters.page > 1) {
    params.set("page", String(filters.page));
  }

  return params.toString();
}

// Даты в MVP не влияют на выдачу: занятости пока нет, её делает Артём.
// Поэтому в API их не отправляем, но в адресе держим — шапка их ставит.
export function buildApiQuery(
  filters: CatalogFilters,
  limit: number,
): string {
  const params = new URLSearchParams(
    buildSearch({
      ...filters,
      checkIn: undefined,
      checkOut: undefined,
    }),
  );

  params.set("limit", String(limit));

  return params.toString();
}

export function countActiveFilters(
  filters: CatalogFilters,
): number {
  return [
    filters.priceMin,
    filters.priceMax,
    filters.rooms,
    filters.type.length > 0 || undefined,
    filters.amenities.length > 0 || undefined,
  ].filter(Boolean).length;
}
