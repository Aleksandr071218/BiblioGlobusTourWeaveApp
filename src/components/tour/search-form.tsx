'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePickerWithRange } from '../ui/date-picker';
import { Calendar, Users, Plane, Search } from 'lucide-react';
import { DateRange } from 'react-day-picker';

const searchSchema = z.object({
  country: z.string().min(1, 'Country is required'),
  dates: z.object({
    from: z.date(),
    to: z.date(),
  }).optional(),
  travelers: z.number().min(1),
});

export type SearchCriteria = {
    country: string;
    dates?: DateRange;
    travelers: number;
}

interface SearchFormProps {
  onSearch: (criteria: SearchCriteria) => void;
  isSearching: boolean;
}

export function SearchForm({ onSearch, isSearching }: SearchFormProps) {
  const form = useForm<z.infer<typeof searchSchema>>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      country: '',
      travelers: 2,
    },
  });

  function onSubmit(values: z.infer<typeof searchSchema>) {
    onSearch(values);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Parameters</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Plane size={16}/> Destination Country</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Turkey, Egypt" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dates"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Calendar size={16}/> Dates</FormLabel>
                    <FormControl>
                        <DatePickerWithRange date={field.value} onDateChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="travelers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Users size={16}/> Travelers</FormLabel>
                    <FormControl>
                        <Input type="number" min="1" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))}/>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSearching}>
              <Search className="mr-2 h-4 w-4" />
              {isSearching ? 'Searching...' : 'Search Tours'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
