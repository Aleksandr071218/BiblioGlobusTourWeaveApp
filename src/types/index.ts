import type {EnrichHotelInfoOutput} from "@/ai/flows/enrich-hotel-info";

export interface Hotel {
  name: string;
  address: string;
  stars: number;
}

export interface Tour {
  id: string;
  country: string;
  city: string;
  departureDate: string;
  returnDate: string;
  price: number;
  hotel: Hotel;
  imageUrl: string;
  imageHint: string;
}

export interface EnrichedTour extends Tour {
  enrichedHotelInfo?: EnrichHotelInfoOutput['googlePlacesInfo'];
}
