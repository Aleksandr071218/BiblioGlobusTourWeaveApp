'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { SearchForm, SearchCriteria } from '@/components/tour/search-form';
import { TourResultsTable } from '@/components/tour/tour-results-table';
import { searchTours } from '@/lib/biblio-globus/search';
import type { Tour } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tours, setTours] = useState<Tour[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleSearch = async (criteria: SearchCriteria) => {
    setIsSearching(true);
    // Using the real API search function instead of mock data
    const results = await searchTours(criteria);
    setTours(results);
    setIsSearching(false);
  };

  if (loading || !user) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <div className="space-y-4">
          <Skeleton className="h-12 w-1/4" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="space-y-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Tour Package Search</h1>
          <p className="text-muted-foreground">Find the perfect tour for your clients.</p>
        </header>
        <SearchForm onSearch={handleSearch} isSearching={isSearching} />
        <TourResultsTable tours={tours} isLoading={isSearching} />
      </div>
    </div>
  );
}
