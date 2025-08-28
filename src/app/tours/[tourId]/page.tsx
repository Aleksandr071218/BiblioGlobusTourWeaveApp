import { notFound } from 'next/navigation';
import { getTourById } from '@/lib/data';
import { enrichHotelInfo } from '@/ai/flows/enrich-hotel-info';
import { summarizeHotelReviews } from '@/ai/flows/summarize-hotel-reviews';
import type { EnrichedTour, ReviewSummary } from '@/types';
import { HotelInfo } from '@/components/tour/hotel-info';
import { HotelReviewsSummary } from '@/components/tour/hotel-reviews-summary';
import Image from 'next/image';
import { format } from 'date-fns';
import { Calendar, MapPin, DollarSign, Star, BedDouble } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default async function TourDetailPage({ params }: { params: { tourId: string } }) {
  const tour = await getTourById(params.tourId);

  if (!tour) {
    notFound();
  }

  // Enrich hotel info using GenAI flow
  const enrichedHotelInfoData = await enrichHotelInfo({
    hotelName: tour.hotel.name,
    hotelAddress: tour.hotel.address,
  });

  let reviewSummary: ReviewSummary | undefined = undefined;
  if (enrichedHotelInfoData.googlePlacesInfo?.reviews && enrichedHotelInfoData.googlePlacesInfo.reviews.length > 0) {
    // Summarize reviews using another GenAI flow
    const summaryData = await summarizeHotelReviews({
      hotelName: tour.hotel.name,
      hotelReviews: enrichedHotelInfoData.googlePlacesInfo.reviews,
    });
    reviewSummary = { summary: summaryData.summary };
  }
  
  // The GenAI flow returns placeholder image URLs. We replace them here for display.
  if (enrichedHotelInfoData.googlePlacesInfo?.photos) {
    enrichedHotelInfoData.googlePlacesInfo.photos = enrichedHotelInfoData.googlePlacesInfo.photos.map(
      (_, i) => `https://picsum.photos/800/600?random=${params.tourId}${i}`
    );
  }

  const enrichedTour: EnrichedTour = {
    ...tour,
    enrichedHotelInfo: enrichedHotelInfoData.googlePlacesInfo,
    reviewSummary,
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
        <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
                <div>
                    <div className="relative h-96 w-full mb-4">
                        <Image
                            src={enrichedTour.imageUrl}
                            alt={enrichedTour.hotel.name}
                            fill
                            className="rounded-lg object-cover shadow-lg"
                            data-ai-hint={enrichedTour.imageHint}
                        />
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight">{enrichedTour.hotel.name}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground mt-1">
                        <MapPin size={16} />
                        <span>{enrichedTour.city}, {enrichedTour.country}</span>
                    </div>
                </div>

                <HotelInfo data={enrichedTour.enrichedHotelInfo} />
                <HotelReviewsSummary data={enrichedTour.reviewSummary} />


            </div>
            <div className="md:col-span-1 space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Tour Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <DollarSign className="text-muted-foreground" size={20}/>
                            <div>
                                <p className="font-semibold text-2xl">${enrichedTour.price.toLocaleString()}</p>
                                <p className="text-sm text-muted-foreground">per traveler</p>
                            </div>
                        </div>
                        <Separator />
                        <div className="flex items-start gap-3">
                           <Calendar className="text-muted-foreground mt-1" size={20}/>
                           <div>
                                <p className="font-semibold">Dates</p>
                                <p className="text-sm text-muted-foreground">
                                    {format(new Date(enrichedTour.departureDate), 'MMM dd, yyyy')} - {format(new Date(enrichedTour.returnDate), 'MMM dd, yyyy')}
                                </p>
                           </div>
                        </div>
                         <Separator />
                        <div className="flex items-start gap-3">
                           <BedDouble className="text-muted-foreground mt-1" size={20}/>
                           <div>
                                <p className="font-semibold">Hotel</p>
                                <p className="text-sm text-muted-foreground">{enrichedTour.hotel.name}</p>
                                <div className="flex items-center">
                                    {Array.from({ length: enrichedTour.hotel.stars }).map((_, i) => (
                                        <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                    ))}
                                </div>
                           </div>
                        </div>
                    </CardContent>
                 </Card>
            </div>
        </div>
    </div>
  );
}
