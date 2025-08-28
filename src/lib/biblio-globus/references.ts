'use server';

import type { createApiClient } from './client';

// Define types for reference data
export interface Country {
    id: string;
    title_ru: string;
    title_en: string;
    code: string;
}

export interface City {
    id: string;
    title_ru: string;
    country: string;
}

export interface Hotel {
    key: string;
    name: string;
    stars: string;
    countryKey: string;
    cityKey: string;
}

type ApiClient = ReturnType<typeof createApiClient>;

const fetchData = async (apiClient: ApiClient, url: string, key?: string) => {
    const response = await apiClient(url, { next: { revalidate: 86400 } }); // Cache for 24 hours
    if (!response.ok) {
        throw new Error(`Failed to fetch reference data from ${url}: ${response.statusText}`);
    }
    const data = await response.json();
    return key ? data[key] : data;
};

export const getCountries = (apiClient: ApiClient): Promise<Country[]> => {
    return fetchData(apiClient, 'http://export.bgoperator.ru/yandex?action=countries');
};

export const getCities = (apiClient: ApiClient): Promise<City[]> => {
    return fetchData(apiClient, 'http://export.bgoperator.ru/auto/jsonResorts.json');
};

export const getHotels = (apiClient: ApiClient): Promise<Hotel[]> => {
    return fetchData(apiClient, 'http://export.bgoperator.ru/yandex?action=hotelsJson');
};

export const getAccommodations = (apiClient: ApiClient) => {
    return fetchData(apiClient, 'http://export.bgoperator.ru/yandex?action=vr');
};

export const getMeals = (apiClient: ApiClient) => {
    return fetchData(apiClient, 'http://export.bgoperator.ru/yandex?action=boards');
};