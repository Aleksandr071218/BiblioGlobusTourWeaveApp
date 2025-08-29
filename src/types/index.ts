import type {EnrichHotelInfoOutput} from "@/ai/flows/enrich-hotel-info";
import type { SummarizeHotelReviewsOutput } from "@/ai/flows/summarize-hotel-reviews";

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
  minPrice?: number; // Minimum price from the price list
  maxPrice?: number; // Maximum price from the price list
}

export type ReviewSummary = SummarizeHotelReviewsOutput;

export interface EnrichedTour extends Tour {
  enrichedHotelInfo?: EnrichHotelInfoOutput['googlePlacesInfo'];
  reviewSummary?: ReviewSummary;
}
