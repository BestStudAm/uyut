// Зеркало типов сервера: server/src/data/listings.ts.
// Меняем только вместе с серверным файлом, иначе каталог тихо разъедется с API.

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
  image?: string;
}

export interface ListingsResponse {
  items: Listing[];
  total: number;
  page: number;
  limit: number;
}

export const housingTypeLabels: Record<
  HousingType,
  string
> = {
  apartment: "Квартира",
  studio: "Студия",
  room: "Комната",
  house: "Дом",
};

export const amenityLabels: Record<
  Amenity,
  string
> = {
  wifi: "Wi-Fi",
  kitchen: "Кухня",
  parking: "Парковка",
  washer: "Стиральная машина",
  tv: "Телевизор",
  ac: "Кондиционер",
  pets: "Можно с животными",
};
