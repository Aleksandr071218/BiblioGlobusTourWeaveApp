'use client';

import type { ReviewSummary } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquareQuote } from 'lucide-react';

interface HotelReviewsSummaryProps {
  data: ReviewSummary | undefined;
}

export function HotelReviewsSummary({ data }: HotelReviewsSummaryProps) {
  if (!data?.summary) {
    return null; // Don't render the card if there's no summary
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquareQuote />
          AI-Powered Review Summary
        </CardTitle>
        <CardDescription>
          A quick overview of what other travelers are saying.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground italic leading-relaxed">
          "{data.summary}"
        </p>
      </CardContent>
    </Card>
  );
}
