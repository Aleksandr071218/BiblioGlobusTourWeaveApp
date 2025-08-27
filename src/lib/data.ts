import type { Tour } from '@/types';
import type { SearchCriteria } from '@/components/tour/search-form';

const allTours: Tour[] = [
  {
    id: '1',
    country: 'Turkey',
    city: 'Antalya',
    departureDate: '2024-09-10',
    returnDate: '2024-09-20',
    price: 1200,
    hotel: {
      name: 'Grand Park Lara',
      address: 'Lara Turizm Yolu, 07230 Muratpaşa/Antalya, Turkey',
      stars: 5,
    },
    imageUrl: 'https://picsum.photos/seed/1/600/400',
    imageHint: 'beach resort',
  },
  {
    id: '2',
    country: 'Egypt',
    city: 'Sharm El Sheikh',
    departureDate: '2024-10-05',
    returnDate: '2024-10-15',
    price: 1500,
    hotel: {
      name: 'Savoy Sharm El Sheikh',
      address: 'SOHO Square, Sharm El Sheikh, South Sinai Governorate 46628, Egypt',
      stars: 5,
    },
    imageUrl: 'https://picsum.photos/seed/2/600/400',
    imageHint: 'pyramids desert',
  },
  {
    id: '3',
    country: 'Thailand',
    city: 'Phuket',
    departureDate: '2024-11-12',
    returnDate: '2024-11-26',
    price: 2200,
    hotel: {
      name: 'The Shore at Katathani',
      address: '14 Kata Noi Rd, Karon, Mueang Phuket District, Phuket 83100, Thailand',
      stars: 5,
    },
    imageUrl: 'https://picsum.photos/seed/3/600/400',
    imageHint: 'tropical island',
  },
  {
    id: '4',
    country: 'UAE',
    city: 'Dubai',
    departureDate: '2024-12-01',
    returnDate: '2024-12-08',
    price: 1800,
    hotel: {
      name: 'Atlantis, The Palm',
      address: 'Crescent Rd - The Palm Jumeirah - Dubai - United Arab Emirates',
      stars: 5,
    },
    imageUrl: 'https://picsum.photos/seed/4/600/400',
    imageHint: 'city skyline',
  },
  {
    id: '5',
    country: 'Turkey',
    city: 'Istanbul',
    departureDate: '2024-09-15',
    returnDate: '2024-09-22',
    price: 950,
    hotel: {
      name: 'Swissôtel The Bosphorus Istanbul',
      address: 'Vişnezade, Acısu Sokaği No:19, 34357 Beşiktaş/İstanbul, Turkey',
      stars: 5
    },
    imageUrl: 'https://picsum.photos/seed/5/600/400',
    imageHint: 'historic city'
  }
];

// Mock function to "fetch" tours. In a real app, this would be an API call.
export const getTours = (criteria: SearchCriteria): Promise<Tour[]> => {
  console.log('Filtering tours with:', criteria);
  return new Promise(resolve => {
    setTimeout(() => {
        if (!criteria.country && !criteria.dates?.from && !criteria.dates?.to) {
            return resolve([]);
        }
      const filtered = allTours.filter(tour => {
        const countryMatch = criteria.country ? tour.country.toLowerCase().includes(criteria.country.toLowerCase()) : true;
        
        let dateMatch = true;
        if (criteria.dates?.from && criteria.dates?.to) {
          const tourDeparture = new Date(tour.departureDate);
          const tourReturn = new Date(tour.returnDate);
          const searchFrom = new Date(criteria.dates.from);
          const searchTo = new Date(criteria.dates.to);
          // Simple overlap check
          dateMatch = tourDeparture <= searchTo && tourReturn >= searchFrom;
        }

        return countryMatch && dateMatch;
      });
      resolve(filtered);
    }, 1000); // Simulate network delay
  });
};

export const getTourById = (id: string): Promise<Tour | undefined> => {
    // NOTE: In a real app, you would first check Firestore for a cached version
    // of this tour data. If not found or stale, you'd fetch from the API
    // and then update the cache in Firestore.
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(allTours.find(tour => tour.id === id));
        }, 500);
    });
}
