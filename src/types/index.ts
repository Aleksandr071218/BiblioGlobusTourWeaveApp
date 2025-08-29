import { z } from 'genkit';
import type {EnrichHotelInfoOutput} from "@/ai/flows/enrich-hotel-info";
import type { SummarizeHotelReviewsOutput } from "@/ai/flows/summarize-hotel-reviews";

export const EnrichHotelInfoOutputSchema = z.object({
  googlePlacesInfo: z.object({
    rating: z.number().optional().describe('The rating of the hotel from Google Places.'),
    photos: z.array(z.string()).optional().describe('URLs of photos of the hotel from Google Places.'),
    amenities: z.array(z.string()).optional().describe('A list of amenities offered by the hotel.'),
    reviews: z.array(z.string()).optional().describe('A list of reviews for the hotel from Google Places.'),
  }).optional().describe('Hotel information from Google Places.'),
});

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