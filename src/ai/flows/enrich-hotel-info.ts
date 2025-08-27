'use server';

/**
 * @fileOverview This file defines a Genkit flow to enrich hotel information with data from Google Places API.
 *
 * - enrichHotelInfo - A function that takes hotel details and adds ratings, photos, and amenities from Google Places.
 * - EnrichHotelInfoInput - The input type for the enrichHotelInfo function.
 * - EnrichHotelInfoOutput - The return type for the enrichHotelInfo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnrichHotelInfoInputSchema = z.object({
  hotelName: z.string().describe('The name of the hotel.'),
  hotelAddress: z.string().describe('The address of the hotel.'),
});
export type EnrichHotelInfoInput = z.infer<typeof EnrichHotelInfoInputSchema>;

const EnrichHotelInfoOutputSchema = z.object({
  googlePlacesInfo: z.object({
    rating: z.number().optional().describe('The rating of the hotel from Google Places.'),
    photos: z.array(z.string()).optional().describe('URLs of photos of the hotel from Google Places.'),
    amenities: z.array(z.string()).optional().describe('A list of amenities offered by the hotel.'),
  }).optional().describe('Hotel information from Google Places.'),
});
export type EnrichHotelInfoOutput = z.infer<typeof EnrichHotelInfoOutputSchema>;

export async function enrichHotelInfo(input: EnrichHotelInfoInput): Promise<EnrichHotelInfoOutput> {
  return enrichHotelInfoFlow(input);
}

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
  }).optional(),
}, async (input) => {
  // TODO: Implement the actual call to the Google Places API here.
  // This is a placeholder implementation.
  console.log('Calling Google Places API with:', input);
  return {
    rating: 4.5,
    photos: [
      'https://example.com/photo1.jpg',
      'https://example.com/photo2.jpg',
    ],
    amenities: ['Free WiFi', 'Swimming pool', 'Restaurant'],
  };
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
    const {output} = await prompt(input);
    return output!;
  }
);
