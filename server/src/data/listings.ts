import { db } from "../db.js";

export type HousingType =
  | "apartment"
  | "studio"
  | "room"
  | "house";

export type Amenity =
  | "wifi"
  | "kitchen"
  | "parking"
  | "washer"
  | "tv"
  | "ac"
  | "pets";

export type ListingStatus =
  | "published"
  | "draft"
  | "hidden";

export interface Listing {
  id: number;
  title: string;
  city: string;
  district: string;
  type: HousingType;
  pricePerNight: number;
  rating: number;
  reviewsCount: number;
  guests: number;
  rooms: number;
  area: number;
  amenities: Amenity[];
  lat: number;
  lng: number;
  status: ListingStatus;
  photos: string[];
  description: string;
  rules: string[];
  address: string;
  ownerId?: number;
}

interface ListingRow {
  id: number;
  owner_id: number | null;
  title: string;
  city: string;
  district: string;
  type: string;
  price_per_night: number;
  rating: number;
  reviews_count: number;
  guests: number;
  rooms: number;
  area: number;
  amenities: string;
  lat: number;
  lng: number;
  status: string;
  photos: string;
  description: string;
  rules: string;
  address: string;
}

function parseJson<T>(
  value: string,
  fallback: T,
): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function mapListing(
  row: ListingRow,
): Listing {
  return {
    id: row.id,
    title: row.title,
    city: row.city,
    district: row.district,
    type: row.type as HousingType,
    pricePerNight: row.price_per_night,
    rating: row.rating,
    reviewsCount: row.reviews_count,
    guests: row.guests,
    rooms: row.rooms,
    area: row.area,
    amenities: parseJson<Amenity[]>(
      row.amenities,
      [],
    ),
    lat: row.lat,
    lng: row.lng,
    status: row.status as ListingStatus,
    photos: parseJson<string[]>(
      row.photos,
      [],
    ),
    description: row.description,
    rules: parseJson<string[]>(
      row.rules,
      [],
    ),
    address: row.address,
    ownerId:
      row.owner_id ?? undefined,
  };
}

function selectFields() {
  return `
    id,
    owner_id,
    title,
    city,
    district,
    type,
    price_per_night,
    rating,
    reviews_count,
    guests,
    rooms,
    area,
    amenities,
    lat,
    lng,
    status,
    photos,
    description,
    rules,
    address
  `;
}

export function getListings(): Listing[] {
  const rows = db
    .prepare(
      `
        SELECT ${selectFields()}
        FROM listings
        ORDER BY id ASC
      `,
    )
    .all() as ListingRow[];

  return rows.map(mapListing);
}

export function findListingById(
  id: number,
): Listing | undefined {
  const row = db
    .prepare(
      `
        SELECT ${selectFields()}
        FROM listings
        WHERE id = ?
        LIMIT 1
      `,
    )
    .get(id) as ListingRow | undefined;

  return row
    ? mapListing(row)
    : undefined;
}

export function findListingsByOwner(
  ownerId: number,
): Listing[] {
  const rows = db
    .prepare(
      `
        SELECT ${selectFields()}
        FROM listings
        WHERE owner_id = ?
        ORDER BY id DESC
      `,
    )
    .all(ownerId) as ListingRow[];

  return rows.map(mapListing);
}

export type NewListing = Omit<
  Listing,
  "id" | "rating" | "reviewsCount" | "ownerId"
>;

export function createListing(
  input: NewListing,
  ownerId: number,
): Listing {
  const result = db
    .prepare(
      `
        INSERT INTO listings (
          owner_id,
          title,
          city,
          district,
          type,
          price_per_night,
          rating,
          reviews_count,
          guests,
          rooms,
          area,
          amenities,
          lat,
          lng,
          status,
          photos,
          description,
          rules,
          address
        )
        VALUES (
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?
        )
      `,
    )
    .run(
      ownerId,
      input.title,
      input.city,
      input.district,
      input.type,
      input.pricePerNight,
      0,
      0,
      input.guests,
      input.rooms,
      input.area,
      JSON.stringify(input.amenities),
      input.lat,
      input.lng,
      input.status,
      JSON.stringify(input.photos),
      input.description,
      JSON.stringify(input.rules),
      input.address,
    );

  const listing = findListingById(
    Number(result.lastInsertRowid),
  );

  if (!listing) {
    throw new Error(
      "Не удалось создать объявление",
    );
  }

  return listing;
}

export function updateListing(
  id: number,
  patch: Partial<Listing>,
): Listing | undefined {
  const existing =
    findListingById(id);

  if (!existing) {
    return undefined;
  }

  const next: Listing = {
    ...existing,
    ...patch,

    // Нельзя изменить ID и владельца
    // через обычное редактирование.
    id: existing.id,
    ownerId: existing.ownerId,
  };

  db.prepare(
    `
      UPDATE listings
      SET
        title = ?,
        city = ?,
        district = ?,
        type = ?,
        price_per_night = ?,
        rating = ?,
        reviews_count = ?,
        guests = ?,
        rooms = ?,
        area = ?,
        amenities = ?,
        lat = ?,
        lng = ?,
        status = ?,
        photos = ?,
        description = ?,
        rules = ?,
        address = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
  ).run(
    next.title,
    next.city,
    next.district,
    next.type,
    next.pricePerNight,
    next.rating,
    next.reviewsCount,
    next.guests,
    next.rooms,
    next.area,
    JSON.stringify(next.amenities),
    next.lat,
    next.lng,
    next.status,
    JSON.stringify(next.photos),
    next.description,
    JSON.stringify(next.rules),
    next.address,
    id,
  );

  return findListingById(id);
}

export function deleteListing(
  id: number,
): boolean {
  const result = db
    .prepare(
      `
        DELETE FROM listings
        WHERE id = ?
      `,
    )
    .run(id);

  return result.changes > 0;
}