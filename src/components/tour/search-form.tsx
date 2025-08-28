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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePickerWithRange } from '../ui/date-picker';
import { Calendar, Users, Plane, Search, Star, Utensils } from 'lucide-react';
import { DateRange } from 'react-day-picker';

const searchSchema = z.object({
  country: z.string().min(1, 'Country is required'),
  dates: z.object({
    from: z.date(),
    to: z.date(),
  }).optional(),
  travelers: z.number().min(1),
  stars: z.string().optional(),
  mealType: z.string().optional(),
});

export type SearchCriteria = {
    country: string;
    dates?: DateRange;
    travelers: number;
    stars?: string;
    mealType?: string;
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
      stars: '',
      mealType: '',
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
            <div className="grid md:grid-cols-5 gap-6">
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
              <FormField
                control={form.control}
                name="stars"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Star size={16}/> Hotel Stars</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Any</SelectItem>
                        <SelectItem value="5*">5 Stars</SelectItem>
                        <SelectItem value="4*">4 Stars</SelectItem>
                        <SelectItem value="3*">3 Stars</SelectItem>
                        <SelectItem value="2*">2 Stars</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
                />
              <FormField
                control={form.control}
                name="mealType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Utensils size={16}/> Meal Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Any" />
                        </Trigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Any</SelectItem>
                        <SelectItem value="AO">Without meals (AO)</SelectItem>
                        <SelectItem value="BB">Breakfast (BB)</SelectItem>
                        <SelectItem value="HB">Half board (HB)</SelectItem>
                        <SelectItem value="FB">Full board (FB)</SelectItem>
                        <SelectItem value="AI">All Inclusive (AI)</SelectItem>
                        <SelectItem value="UAI">Ultra All Inclusive (UAI)</SelectItem>
                      </SelectContent>
                    </Select>
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
