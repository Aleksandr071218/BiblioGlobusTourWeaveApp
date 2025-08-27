'use server';

/**
 * @fileOverview This file defines a Genkit flow to summarize Google Places reviews for hotels.
 *
 * - summarizeHotelReviews - A function that takes hotel details and summarizes the Google Places reviews.
 * - SummarizeHotelReviewsInput - The input type for the summarizeHotelReviews function.
 * - SummarizeHotelReviewsOutput - The return type for the summarizeHotelReviews function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeHotelReviewsInputSchema = z.object({
  hotelName: z.string().describe('The name of the hotel.'),
  hotelReviews: z.array(z.string()).describe('The reviews of the hotel from Google Places.'),
});
export type SummarizeHotelReviewsInput = z.infer<typeof SummarizeHotelReviewsInputSchema>;

const SummarizeHotelReviewsOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the hotel reviews.'),
});
export type SummarizeHotelReviewsOutput = z.infer<typeof SummarizeHotelReviewsOutputSchema>;

export async function summarizeHotelReviews(input: SummarizeHotelReviewsInput): Promise<SummarizeHotelReviewsOutput> {
  return summarizeHotelReviewsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeHotelReviewsPrompt',
  input: {schema: SummarizeHotelReviewsInputSchema},
  output: {schema: SummarizeHotelReviewsOutputSchema},
  prompt: `You are an AI that summarizes hotel reviews from Google Places.

  The user will provide the hotel name and a list of reviews. Your task is to summarize the reviews into a concise and informative summary.

  Hotel Name: {{{hotelName}}}
  Hotel Reviews: {{{hotelReviews}}}

  Summary:
`,
});

const summarizeHotelReviewsFlow = ai.defineFlow(
  {
    name: 'summarizeHotelReviewsFlow',
    inputSchema: SummarizeHotelReviewsInputSchema,
    outputSchema: SummarizeHotelReviewsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
