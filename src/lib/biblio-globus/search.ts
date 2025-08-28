'use server';

import { createHash } from 'crypto';
import { authenticate } from './auth';
import { createApiClient } from './client';
import type { SearchCriteria } from '@/components/tour/search-form';
import type { Tour } from '@/types';
import { getCountries, getCities, getHotels } from './references';
import { format } from 'date-fns';

// In-memory cache for search results
const searchCache = new Map<string, Tour[]>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: Tour[];
  timestamp: number;
}

// Interfaces for Biblio-Globus API responses
interface PriceListEntry {
  url: string;
  date: string;
  duration: string;
  id_price: string;
}

interface TourPrice {
    amount: string;
    RUR?: string;
    ag: string;
}

interface TourEntry {
    id_hotel: string;
    id_ns: string;
    duration: string;
    prices: TourPrice[];
}


/**
 * Searches for tours using the real Biblio-Globus API.
 * @param criteria - The search criteria from the user form.
 * @returns A promise that resolves to an array of tours.
 */
export async function searchTours(criteria: SearchCriteria): Promise<Tour[]> {
  // Create a cache key based on the search criteria
  const cacheKey = createHash('sha256').update(JSON.stringify(criteria)).digest('hex');
  
  // Check if we have a valid cached result
  const cachedEntry = searchCache.get(cacheKey);
  if (cachedEntry && (Date.now() - cachedEntry.timestamp) < CACHE_TTL) {
    console.log('Returning cached tour search results for criteria:', criteria);
    return cachedEntry.data;
  }

  console.log('Starting real tour search with criteria:', criteria);

  try {
    const cookie = await authenticate();
    const apiClient = await createApiClient(cookie);

    // 1. Get references to resolve names to IDs
    const [countries, cities, hotels] = await Promise.all([
        getCountries(apiClient),
        getCities(apiClient),
        getHotels(apiClient)
    ]);

    const targetCountry = countries.find(c => c.title_ru.toLowerCase() === criteria.country.toLowerCase());
    if (!targetCountry) {
        console.warn(`Country not found: ${criteria.country}`);
        return [];
    }

    // For now, we'll hardcode Moscow as departure city for simplicity
    const departureCity = cities.find(c => c.title_ru === 'Москва');
    if (!departureCity) {
        console.warn('Departure city "Москва" not found in references.');
        return [];
    }

    // 2. Get available price lists
    let priceListUrl = `http://export.bgoperator.ru/yandex?action=files&flt=${targetCountry.id}&flt2=${departureCity.id}&xml=11`;
    
    // Add extra filters to URL
    if (criteria.stars) {
      priceListUrl += `&f3=${encodeURIComponent(criteria.stars)}`;
    }
    if (criteria.mealType) {
      priceListUrl += `&f8=${encodeURIComponent(criteria.mealType)}`;
    }

    const priceListResponse = await apiClient(priceListUrl);
    if (!priceListResponse.ok) {
        throw new Error(`Failed to fetch price lists: ${priceListResponse.statusText}`);
    }
    const priceListData: { entries: PriceListEntry[] } = await priceListResponse.json();
    
    let allFoundTours: Tour[] = [];

    // 3. Fetch and process each relevant price list
    // Let's limit to first 3 price lists for performance in this example
    const relevantPriceLists = priceListData.entries.slice(0, 3); 

    for (const priceList of relevantPriceLists) {
        // Apply date filters if provided
        if (criteria.dates?.from) {
            const priceListDate = new Date(priceList.date.split('.').reverse().join('-'));
            if (priceListDate < criteria.dates.from || (criteria.dates.to && priceListDate > criteria.dates.to)) {
                continue; // Skip this price list as it's outside the user's date range
            }
        }
        
        let tourDetailsUrl = priceList.url;
        // The URL from price list already contains filters, but we ensure they are present if user specified them
        // This logic can be refined, but for now we just append. The API seems to handle duplicate params.
        if (criteria.stars && !tourDetailsUrl.includes('&f3=')) {
          tourDetailsUrl += `&f3=${encodeURIComponent(criteria.stars)}`;
        }
        if (criteria.mealType && !tourDetailsUrl.includes('&f8=')) {
          tourDetailsUrl += `&f8=${encodeURIComponent(criteria.mealType)}`;
        }

        const tourDetailsResponse = await apiClient(tourDetailsUrl);
        if (!tourDetailsResponse.ok) {
            console.warn(`Failed to fetch tour details from ${tourDetailsUrl}`);
            continue;
        }
        const tourDetailsData: { entries: TourEntry[] } = await tourDetailsResponse.json();

        const toursFromPriceList = tourDetailsData.entries.map(entry => {
            const hotelInfo = hotels.find(h => h.key === entry.id_hotel);
            const priceInfo = entry.prices.find(p => p.ag.includes('14-99') || p.ag.includes('12+')); // Find price for adults
            
            if (!hotelInfo || !priceInfo) return null;

            const departureDate = new Date(priceList.date.split('.').reverse().join('-'));
            const durationDays = parseInt(entry.duration, 10);
            const returnDate = new Date(departureDate);
            returnDate.setDate(departureDate.getDate() + durationDays);


            return {
                id: `${entry.id_hotel}-${priceList.id_price}-${entry.id_ns}`,
                country: targetCountry.title_ru,
                city: cities.find(c => c.id === hotelInfo.cityKey)?.title_ru || 'Unknown City',
                departureDate: format(departureDate, 'yyyy-MM-dd'),
                returnDate: format(returnDate, 'yyyy-MM-dd'),
                price: parseInt(priceInfo.RUR || priceInfo.amount, 10), // Prefer RUR, fallback to amount
                hotel: {
                    name: hotelInfo.name,
                    address: `${cities.find(c => c.id === hotelInfo.cityKey)?.title_ru}, ${targetCountry.title_ru}`, // Mock address
                    stars: parseInt(hotelInfo.stars, 10) || 0,
                },
                imageUrl: `https://picsum.photos/seed/${entry.id_hotel}/600/400`,
                imageHint: 'hotel exterior',
            };
        }).filter((t): t is Tour => t !== null);

        allFoundTours = [...allFoundTours, ...toursFromPriceList];
    }
    
    // Limit results to avoid overwhelming the UI
    const results = allFoundTours.slice(0, 25);
    
    // Save results to cache
    searchCache.set(cacheKey, {
      data: results,
      timestamp: Date.now()
    });
    
    // Optional: Clean up old cache entries to prevent memory leaks
    // This is a simple cleanup; in a production environment, you might want a more robust solution
    if (searchCache.size > 100) { // Arbitrary limit
      const now = Date.now();
      for (const [key, entry] of searchCache.entries()) {
        if ((now - entry.timestamp) >= CACHE_TTL) {
          searchCache.delete(key);
        }
      }
    }

    return results;

  } catch (error) {
    console.error('An error occurred during tour search:', error);
    // In case of error, we can return an empty array or re-throw
    return [];
  }
}
