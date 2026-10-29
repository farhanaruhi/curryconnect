import api from './api';
import type { User } from './authService';

export interface Curry {
  id: number;
  user_id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  price: number;
  description?: string;
  image_url?: string;
  restaurant?: string;
  latitude: number;
  longitude: number;
  fresh_until: string;
  pickup_time: string;
  booked_by_id?: number;
  booked_by_name?: string;
  booked_by_phone?: string;
  created_at: string;
  owner?: User;
  average_rating?: number;
}

export interface CurrySearchResult {
  curry: Curry;
  distance_meters: number;
  recommendation_score: number;
  score_breakdown: {
    distance: number;
    freshness: number;
    quantity: number;
    rating: number;
    popularity: number;
  };
  is_fresh: boolean;
  average_rating: number;
  content_similarity?: number;
  predicted_satisfaction?: number;
  expanded_radius?: boolean;
}

export interface Rating {
  id: number;
  user_id: number;
  curry_id: number;
  rating: number;
  review?: string;
  created_at: string;
  reviewer_name?: string;
}

export const curryService = {
  createCurry: async (curryData: any): Promise<Curry> => {
    const response = await api.post<Curry>('/curries/', curryData);
    return response.data;
  },

  getAllCurries: async (): Promise<Curry[]> => {
    const response = await api.get<Curry[]>('/curries/');
    return response.data;
  },

  searchCurries: async (params: {
    lat: number;
    lon: number;
    radius_km?: number;
    category?: string;
    query?: string;
  }): Promise<CurrySearchResult[]> => {
    const response = await api.get<CurrySearchResult[]>('/curries/search', { params });
    return response.data;
  },

  getCurryById: async (id: number): Promise<Curry> => {
    const response = await api.get<Curry>(`/curries/${id}`);
    return response.data;
  },

  updateCurry: async (id: number, curryData: any): Promise<Curry> => {
    const response = await api.put<Curry>(`/curries/${id}`, curryData);
    return response.data;
  },

  deleteCurry: async (id: number): Promise<void> => {
    await api.delete(`/curries/${id}`);
  },

  rateCurry: async (id: number, ratingData: { rating: number; review?: string }): Promise<Rating> => {
    const response = await api.post<Rating>(`/curries/${id}/rate`, ratingData);
    return response.data;
  },

  getCurryRatings: async (id: number): Promise<Rating[]> => {
    const response = await api.get<Rating[]>(`/curries/${id}/ratings`);
    return response.data;
  },

  bookCurry: async (id: number): Promise<Curry> => {
    const response = await api.post<Curry>(`/curries/${id}/book`);
    return response.data;
  }
};
