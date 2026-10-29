import api from './api';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  latitude: number;
  longitude: number;
  rating: number;
  preference: 'Veg' | 'Non-Veg' | 'Both';
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const authService = {
  login: async (credentials: any): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  register: async (userData: any): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', userData);
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await api.get<User>('/users/me');
    return response.data;
  },

  updateProfile: async (profileData: Partial<User>): Promise<User> => {
    const response = await api.put<User>('/users/me', profileData);
    return response.data;
  },

  getSearchHistory: async (): Promise<Array<{
    id: number;
    query?: string;
    latitude: number;
    longitude: number;
    timestamp: string;
  }>> => {
    const response = await api.get('/users/me/search-history');
    return response.data;
  },
};
