'use server';

/**
 * @fileOverview This file defines a Genkit flow to provide AI-driven recommendations for tour packages based on client preferences.
 *
 * - recommendTourPackages - A function that takes client preferences and returns recommended tour packages.
 * - RecommendTourPackagesInput - The input type for the recommendTourPackages function.
 * - RecommendTourPackagesOutput - The return type for the recommendTourPackages function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { searchTours } from '@/lib/biblio-globus/search';
import type { Tour } from '@/types';
import { enrichHotelInfo, EnrichHotelInfoOutput } from './enrich-hotel-info';

const RecommendTourPackagesInputSchema = z.object({
  preferences: z.string().describe("A natural language description of the client's preferences (e.g., budget, interests, travel style, destination, dates, duration)."),
});
export type RecommendTourPackagesInput = z.infer<typeof RecommendTourPackagesInputSchema>;

const TourPackageSchema = z.object({
  tourName: z.string().describe('The name of the tour package.'),
  description: z.string().describe('A brief, engaging description of the tour package, tailored to the user\'s preferences.'),
  price: z.number().describe('The price of the tour package.'),
  hotelName: z.string().describe('The name of the hotel included in the package.'),
  country: z.string().describe('The country where the tour is located.'),
  city: z.string().describe('The city where the tour is located.'),
  departureDate: z.string().describe('The departure date in YYYY-MM-DD format.'),
  returnDate: z.string().describe('The return date in YYYY-MM-DD format.'),
  imageUrl: z.string().describe('A placeholder image URL for the tour.'),
  tourId: z.string().describe('The original ID of the tour.'),
  enrichedInfo: EnrichHotelInfoOutputSchema.optional().describe('Enriched hotel information from Google Places.'),
});

const RecommendTourPackagesOutputSchema = z.object({
    recommendations: z.array(TourPackageSchema).describe('An array of recommended tour packages.'),
    summary: z.string().describe('A brief summary of why these recommendations fit the user\'s request.'),
});
export type RecommendTourPackagesOutput = z.infer<typeof RecommendTourPackagesOutputSchema>;

export async function recommendTourPackages(input: RecommendTourPackagesInput): Promise<RecommendTourPackagesOutput> {
  return recommendTourPackagesFlow(input);
}

const searchToursTool = ai.defineTool({
  name: 'searchTours',
  description: 'Searches for available tour packages based on specific criteria. Use this to find real tours to recommend.',
  inputSchema: z.object({
      country: z.string().describe("The destination country. This is a mandatory field."),
      // Other fields from SearchCriteria are optional for the tool
      stars: z.string().optional().describe("Hotel star rating (e.g., '5*', '4*')."),
      mealType: z.string().optional().describe("Meal type (e.g., 'AI', 'BB')."),
      travelers: z.number().optional().describe("Number of travelers, defaults to 2."),
  }),
  outputSchema: z.array(z.any()), // We'll use a generic object array since Tour type is complex
}, async (input) => {
  console.log('Tool searching tours with:', input);
  const results = await searchTours({
      country: input.country,
      stars: input.stars,
      mealType: input.mealType,
      travelers: input.travelers || 2,
  });
  // Return a limited set of fields to the AI to keep the context small
  return results.slice(0, 5).map(tour => ({
    tourId: tour.id,
    country: tour.country,
    city: tour.city,
    hotelName: tour.hotel.name,
    hotelAddress: tour.hotel.address, // Pass address for enrichment
    stars: tour.hotel.stars,
    price: tour.price,
    departureDate: tour.departureDate,
    returnDate: tour.returnDate,
    imageUrl: tour.imageUrl,
  }));
});

const enrichSingleTour = async (tour: any): Promise<any> => {
    try {
        const enrichedInfo = await enrichHotelInfo({
            hotelName: tour.hotelName,
            hotelAddress: tour.hotelAddress,
        });
        return { ...tour, enrichedInfo: enrichedInfo.googlePlacesInfo };
    } catch (e) {
        console.error(`Failed to enrich info for ${tour.hotelName}`, e);
        return tour; // Return original tour if enrichment fails
    }
};

const prompt = ai.definePrompt({
  name: 'recommendTourPackagesPrompt',
  input: {schema: RecommendTourPackagesInputSchema},
  output: {schema: RecommendTourPackagesOutputSchema},
  tools: [searchToursTool],
  prompt: `You are an expert AI travel agent. Your goal is to help a human travel agent find the perfect tour packages for their clients based on their preferences.

  Analyze the user's request: {{{preferences}}}

  1.  First, identify the key criteria from the request like destination country, budget, travel style (luxury, budget, family), interests, and desired dates. The destination country is the most important criteria for search.
  2.  Use the 'searchTours' tool to find a list of available tours. You MUST provide at least the country. You can also filter by star rating or meal type if it matches the request.
  3.  From the search results, select up to 3 of the most relevant tours that best match the client's preferences.
  4.  For each selected tour, write a short, engaging, and personalized description (the 'description' field) explaining WHY this specific tour is a great fit. For example, if a user wants a relaxing beach vacation, highlight the hotel's beach access or spa facilities.
  5.  Finally, provide a brief overall summary ('summary' field) of your recommendations, explaining how they align with the client's request.
  
  Return a structured response with the summary and the list of recommended packages.
`,
});

const recommendTourPackagesFlow = ai.defineFlow(
  {
    name: 'recommendTourPackagesFlow',
    inputSchema: RecommendTourPackagesInputSchema,
    outputSchema: RecommendTourPackagesOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);

    if (!output || !output.recommendations) {
        throw new Error('AI failed to generate recommendations.');
    }

    // Enrich tour data with Google Places info in parallel
    const enrichedRecommendations = await Promise.all(
        output.recommendations.map(tour => enrichSingleTour(tour))
    );
    
    output.recommendations = enrichedRecommendations;
    return output;
  }
);
