'use client';

import Image from 'next/image';
import type { EnrichHotelInfoOutput } from '@/ai/flows/enrich-hotel-info';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge';
import { Star, Wifi, Utensils, Waves, Wind, ParkingCircle, Dumbbell } from 'lucide-react';

interface HotelInfoProps {
  data: EnrichHotelInfoOutput['googlePlacesInfo'];
}

const amenityIcons: { [key: string]: React.ReactNode } = {
  'free wifi': <Wifi size={16} />,
  'restaurant': <Utensils size={16} />,
  'swimming pool': <Waves size={16} />,
  'air conditioning': <Wind size={16} />,
  'parking': <ParkingCircle size={16} />,
  'gym': <Dumbbell size={16}/>,
};

export function HotelInfo({ data }: HotelInfoProps) {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hotel Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Detailed hotel information is not available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {data.photos && data.photos.length > 0 && (
         <Card>
            <CardHeader>
                <CardTitle>Photo Gallery</CardTitle>
            </CardHeader>
            <CardContent>
                <Carousel className="w-full">
                    <CarouselContent>
                    {data.photos.map((photo, index) => (
                        <CarouselItem key={index}>
                            <div className="relative aspect-video">
                                <Image
                                src={photo}
                                alt={`Hotel photo ${index + 1}`}
                                fill
                                className="rounded-md object-cover"
                                data-ai-hint="hotel interior"
                                />
                            </div>
                        </CarouselItem>
                    ))}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                </Carousel>
            </CardContent>
         </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Ratings & Amenities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            {data.rating && (
                <div className="flex items-center gap-2">
                <span className="font-semibold">Google Rating:</span>
                <Badge variant="secondary" className="text-base flex items-center gap-1">
                  {data.rating}
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                </Badge>
              </div>
            )}
            
            {data.amenities && data.amenities.length > 0 && (
                <div>
                    <h3 className="font-semibold mb-2">Key Amenities</h3>
                    <div className="flex flex-wrap gap-2">
                        {data.amenities.map((amenity) => (
                        <Badge key={amenity} variant="outline" className="flex items-center gap-2">
                            {amenityIcons[amenity.toLowerCase()] || <Star size={16} />}
                            {amenity}
                        </Badge>
                        ))}
                    </div>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
