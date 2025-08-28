'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { recommendTourPackages, RecommendTourPackagesOutput } from '@/ai/flows/tour-package-recommendation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Bot, User } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import Image from 'next/image';
import { Badge } from '../ui/badge';
import Link from 'next/link';

const formSchema = z.object({
  preferences: z.string().min(10, { message: 'Please describe the client\'s preferences in at least 10 characters.' }),
});

export function AiAssistant() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<RecommendTourPackagesOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      preferences: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);
    setResults(null);
    try {
      const response = await recommendTourPackages(values);
      setResults(response);
    } catch (e: any) {
      setError('An error occurred while getting recommendations. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  const renderSkeleton = () => (
    <div className="space-y-6">
        <div className='flex items-start gap-4'>
            <Bot className="h-8 w-8 text-primary" />
            <div className='w-full space-y-2'>
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </div>
        </div>
        <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                    <Skeleton className="h-48 w-full rounded-t-lg" />
                    <CardHeader>
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-12 w-full" />
                    </CardContent>
                    <CardFooter>
                        <Skeleton className="h-10 w-24" />
                    </CardFooter>
                </Card>
            ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
                <div className='flex items-center gap-2'>
                    <User className="h-6 w-6 text-muted-foreground"/>
                    <CardTitle>Client Preferences</CardTitle>
                </div>
              <CardDescription>
                Describe what the client is looking for. For example: "A family of 4 looking for a 7-day all-inclusive beach resort in Turkey in August, budget around $3000."
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="preferences"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Luxury honeymoon in Thailand..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading}>
                <Sparkles className="mr-2 h-4 w-4" />
                {isLoading ? 'Getting Recommendations...' : 'Get AI Recommendations'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {isLoading && renderSkeleton()}

      {error && (
        <Card className="border-destructive">
            <CardHeader>
                <CardTitle className="text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent>
                <p>{error}</p>
            </CardContent>
        </Card>
        )}

      {results && (
        <div className="space-y-6">
            <div className='flex items-start gap-4 p-4 bg-secondary/50 rounded-lg'>
                <Bot className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                <div>
                    <h3 className="text-lg font-semibold">AI Summary</h3>
                    <p className="text-muted-foreground">{results.summary}</p>
                </div>
            </div>

            <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-6">
                {results.recommendations.map((tour) => (
                    <Card key={tour.tourId} className="flex flex-col">
                        <div className="relative h-48 w-full">
                            <Image src={tour.imageUrl} alt={tour.hotelName} fill className="rounded-t-lg object-cover" data-ai-hint="hotel exterior"/>
                        </div>
                        <CardHeader>
                            <CardTitle>{tour.hotelName}</CardTitle>
                            <CardDescription>{tour.city}, {tour.country}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <p className="text-sm text-muted-foreground italic">"{tour.description}"</p>
                        </CardContent>
                        <CardFooter className="flex justify-between items-center">
                            <Badge variant="secondary" className="text-lg">${tour.price.toLocaleString()}</Badge>
                            <Button asChild>
                                <Link href={`/tours/${tour.tourId}`}>View Details</Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
      )}
    </div>
  );
}
