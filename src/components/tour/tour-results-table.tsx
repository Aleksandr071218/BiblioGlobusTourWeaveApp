'use client';

import { useRouter } from 'next/navigation';
import type { Tour } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { format } from 'date-fns';
import { Skeleton } from '../ui/skeleton';
import { Star } from 'lucide-react';

interface TourResultsTableProps {
  tours: Tour[];
  isLoading: boolean;
}

export function TourResultsTable({ tours, isLoading }: TourResultsTableProps) {
  const router = useRouter();

  const handleRowClick = (tourId: string) => {
    router.push(`/tours/${tourId}`);
  };

  const renderSkeleton = () => (
    Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={index}>
            <TableCell><Skeleton className="h-16 w-24 rounded-md" /></TableCell>
            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
            <TableCell><Skeleton className="h-5 w-48" /></TableCell>
            <TableCell><Skeleton className="h-5 w-36" /></TableCell>
            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
        </TableRow>
    ))
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Results</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead></TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Hotel</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                renderSkeleton()
            ) : tours.length > 0 ? (
              tours.map((tour) => (
                <TableRow
                  key={tour.id}
                  onClick={() => handleRowClick(tour.id)}
                  className="cursor-pointer"
                >
                  <TableCell>
                    <Image 
                        src={tour.imageUrl} 
                        alt={tour.hotel.name}
                        width={100}
                        height={66}
                        className="rounded-md object-cover"
                        data-ai-hint={tour.imageHint}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{tour.city}</div>
                    <div className="text-sm text-muted-foreground">{tour.country}</div>
                  </TableCell>
                  <TableCell>
                    <div>{tour.hotel.name}</div>
                    <div className="flex items-center">
                        {Array.from({ length: tour.hotel.stars }).map((_, i) => (
                            <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(tour.departureDate), 'MMM dd, yyyy')} - {format(new Date(tour.returnDate), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    {tour.minPrice !== undefined && tour.maxPrice !== undefined ? (
                      <>
                        <Badge variant="secondary">
                          ${tour.minPrice.toLocaleString()} - ${tour.maxPrice.toLocaleString()}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          от {tour.minPrice.toLocaleString()} руб. за человека
                        </div>
                      </>
                    ) : (
                      <Badge variant="secondary">${tour.price?.toLocaleString() ?? 'N/A'}</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                  No tours found. Please try a different search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
