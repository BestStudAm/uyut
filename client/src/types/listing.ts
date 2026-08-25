export interface Listing {
  id: number;
  title: string;
  district: string;
  guests: number;
  rooms: number;
  area: number;
  pricePerNight: number;
  rating: number;
  hasWifi: boolean;
  image?: string;
}