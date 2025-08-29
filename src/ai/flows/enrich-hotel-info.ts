'use server';

/**
 * @fileOverview This file defines a Genkit flow to enrich hotel information with data from Google Places API.
 *
 * - enrichHotelInfo - A function that takes hotel details and adds ratings, photos, and amenities from Google Places.
 * - EnrichHotelInfoInput - The input type for the enrichHotelInfo function.
 * - EnrichHotelInfoOutput - The return type for the enrichHotelInfo function.
 */
 
import { createHash } from 'crypto';
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {Client, PlaceData, PlaceDetailsRequest, PlacePhoto, PlaceReview} from '@googlemaps/google-maps-services-js';

const EnrichHotelInfoInputSchema = z.object({
  hotelName: z.string().describe('The name of the hotel.'),
  hotelAddress: z.string().describe('The address of the hotel.'),
});
export type EnrichHotelInfoInput = z.infer<typeof EnrichHotelInfoInputSchema>;

import { EnrichHotelInfoOutputSchema } from '@/types';

interface EnrichCacheEntry {
  data: EnrichHotelInfoOutput;
  timestamp: number;
}

// In-memory cache for enriched hotel info
const enrichCache = new Map<string, EnrichCacheEntry>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function enrichHotelInfo(input: EnrichHotelInfoInput): Promise<EnrichHotelInfoOutput> {
  return enrichHotelInfoFlow(input);
}

// Helper function to map amenities
const mapAmenity = (type: string): string | null => {
  const amenityMap: { [key: string]: string } = {
    wifi: 'Free WiFi',
    restaurant: 'Restaurant',
    pool: 'Swimming pool',
    spa: 'Spa',
    gym: 'Gym',
    bar: 'Bar',
    parking: 'Parking',
    room_service: 'Room Service',
    airport_transfer: 'Airport Transfer',
    laundry: 'Laundry',
  };
  return amenityMap[type] || null;
};


const getGooglePlacesInfo = ai.defineTool({
  name: 'getGooglePlacesInfo',
  description: 'Retrieves hotel information from Google Places API, including ratings, photos, and amenities.',
  inputSchema: z.object({
    hotelName: z.string().describe('The name of the hotel.'),
    hotelAddress: z.string().describe('The address of the hotel.'),
  }),
  outputSchema: z.object({
    rating: z.number().optional().describe('The rating of the hotel from Google Places.'),
    photos: z.array(z.string()).optional().describe('URLs of photos of the hotel from Google Places.'),
    amenities: z.array(z.string()).optional().describe('A list of amenities offered by the hotel.'),
    reviews: z.array(z.string()).optional().describe('A list of reviews for the hotel from Google Places.'),
  }).optional(),
}, async (input) => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.error('GOOGLE_PLACES_API_KEY environment variable not set.');
    // This error will be caught by the surrounding try/catch block in the flow
    throw new Error('API key is not configured.');
  }

  const client = new Client({});

  try {
    // 1. Find Place ID
    const findPlaceResponse = await client.findPlaceFromText({
      params: {
        input: `${input.hotelName}, ${input.hotelAddress}`,
        inputtype: 'textquery',
        fields: ['place_id', 'name'],
        key: apiKey,
      },
    });

    if (findPlaceResponse.data.candidates.length === 0) {
      console.warn(`No Google Places result found for: ${input.hotelName}`);
      return undefined;
    }

    const placeId = findPlaceResponse.data.candidates[0].place_id;
    if (!placeId) {
      console.warn(`No Place ID found for: ${input.hotelName}`);
      return undefined;
    }

    // 2. Get Place Details
    const detailsRequest: PlaceDetailsRequest = {
        params: {
            place_id: placeId,
            fields: ['rating', 'photos', 'types', 'reviews'],
            key: apiKey,
        }
    }
    const detailsResponse = await client.placeDetails(detailsRequest);
    const placeData: Partial<PlaceData> = detailsResponse.data.result;

    // 3. Format Photos
    const photos = placeData.photos?.slice(0, 5).map((photo: PlacePhoto) => {
        return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${apiKey}`;
    }) || [];

    // 4. Format Amenities
    const amenities: string[] = [];
    if (placeData.types) {
        placeData.types.forEach(type => {
            const mapped = mapAmenity(type);
            if (mapped) amenities.push(mapped);
        })
    }
    // Add some common defaults if none are found from types
    if (amenities.length === 0) {
        amenities.push('Free WiFi', 'Restaurant', 'Swimming pool');
    }
    
    // 5. Format Reviews
    const reviews = placeData.reviews?.map((review: PlaceReview) => review.text).filter(text => text) || [];


    return {
      rating: placeData.rating,
      photos: photos,
      amenities: [...new Set(amenities)], // Remove duplicates
      reviews: reviews,
    };
  } catch (error: any) {
    console.error('Error fetching data from Google Places API:', error.response?.data || error.message);
    throw new Error('Failed to retrieve data from Google Places API.');
  }
});

const prompt = ai.definePrompt({
  name: 'enrichHotelInfoPrompt',
  input: {schema: EnrichHotelInfoInputSchema},
  output: {schema: EnrichHotelInfoOutputSchema},
  tools: [getGooglePlacesInfo],
  prompt: `You are an AI that enriches hotel information with data from Google Places.

  The user will provide the hotel name and address. Use the getGooglePlacesInfo tool to retrieve
  hotel ratings, photos, and amenities from Google Places, if available.

  Hotel Name: {{{hotelName}}}
  Hotel Address: {{{hotelAddress}}}

  Return the Google Places information in the specified output format.
`,
});

const enrichHotelInfoFlow = ai.defineFlow(
  {
    name: 'enrichHotelInfoFlow',
    inputSchema: EnrichHotelInfoInputSchema,
    outputSchema: EnrichHotelInfoOutputSchema,
  },
  async input => {
    // Create a cache key based on the input
    const cacheKey = createHash('sha256').update(JSON.stringify(input)).digest('hex');
    
    // Check if we have a valid cached result
    const cachedEntry = enrichCache.get(cacheKey);
    if (cachedEntry && (Date.now() - cachedEntry.timestamp) < CACHE_TTL) {
      console.log('Returning cached enriched info for hotel:', input.hotelName);
      return cachedEntry.data;
    }

    const {output} = await prompt(input);
    
    // Save result to cache with timestamp
    if (output) {
      enrichCache.set(cacheKey, { data: output, timestamp: Date.now() });
    }
    
    return output!;
  }
);