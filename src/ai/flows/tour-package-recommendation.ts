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

const RecommendTourPackagesInputSchema = z.object({
  budget: z.number().describe('The client\u0027s budget for the tour package.'),
  interests: z.string().describe('The client\u0027s interests (e.g., history, adventure, relaxation).'),
  travelStyle: z.string().describe('The client\u0027s preferred travel style (e.g., luxury, budget-friendly, family-friendly).'),
  country: z.string().describe('The country the client wants to visit.'),
  departureCity: z.string().describe('The city the client will depart from.'),
  departureDate: z.string().describe('The date the client will depart.'),
  duration: z.number().describe('The duration of the trip in days.'),
});
export type RecommendTourPackagesInput = z.infer<typeof RecommendTourPackagesInputSchema>;

const TourPackageSchema = z.object({
  tourName: z.string().describe('The name of the tour package.'),
  description: z.string().describe('A brief description of the tour package.'),
  price: z.number().describe('The price of the tour package.'),
  hotelName: z.string().describe('The name of the hotel included in the package.'),
  rating: z.number().optional().describe('The rating of the hotel from Google Places.'),
  photos: z.array(z.string()).optional().describe('URLs of photos of the hotel from Google Places.'),
  amenities: z.array(z.string()).optional().describe('A list of amenities offered by the hotel.'),
  url: z.string().describe('The url to book the tour.'),
});

const RecommendTourPackagesOutputSchema = z.array(TourPackageSchema).describe('An array of recommended tour packages.');
export type RecommendTourPackagesOutput = z.infer<typeof RecommendTourPackagesOutputSchema>;

export async function recommendTourPackages(input: RecommendTourPackagesInput): Promise<RecommendTourPackagesOutput> {
  return recommendTourPackagesFlow(input);
}

const searchToursTool = ai.defineTool({
  name: 'searchTours',
  description: 'Searches for tour packages based on the provided criteria.',
  inputSchema: RecommendTourPackagesInputSchema,
  outputSchema: z.array(TourPackageSchema),
}, async (input) => {
  // TODO: Implement the actual call to the searchTours Cloud Function here.
  // This is a placeholder implementation.
  console.log('Calling searchTours Cloud Function with:', input);
  return [
    {
      tourName: 'Example Tour Package',
      description: 'A fantastic tour package for example purposes.',
      price: 1200,
      hotelName: 'Example Hotel',
      rating: 4.5,
      photos: [
        'https://example.com/photo1.jpg',
        'https://example.com/photo2.jpg',
      ],
      amenities: ['Free WiFi', 'Swimming pool', 'Restaurant'],
      url: 'https://example.com/tour',
    },
  ];
});

const prompt = ai.definePrompt({
  name: 'recommendTourPackagesPrompt',
  input: {schema: RecommendTourPackagesInputSchema},
  output: {schema: RecommendTourPackagesOutputSchema},
  tools: [searchToursTool],
  prompt: `You are an AI travel agent that recommends tour packages based on client preferences.

The user will provide their budget, interests, travel style, and desired destination.
Use the searchTours tool to find tour packages that match the client\u0027s preferences.

Budget: {{{budget}}}
Interests: {{{interests}}}
Travel Style: {{{travelStyle}}}
Country: {{{country}}}
Departure City: {{{departureCity}}}
Departure Date: {{{departureDate}}}
Duration: {{{duration}}}

Return an array of recommended tour packages in the specified output format.
`,
});

const recommendTourPackagesFlow = ai.defineFlow(
  {
    name: 'recommendTourPackagesFlow',
    inputSchema: RecommendTourPackagesInputSchema,
    outputSchema: RecommendTourPackagesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

