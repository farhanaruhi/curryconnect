import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import type { User } from '../services/authService';

interface Location {
  latitude: number;
  longitude: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  userLocation: Location;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    latitude: number;
    longitude: number;
    preference: 'Veg' | 'Non-Veg' | 'Both';
  }) => Promise<void>;
  logout: () => void;
  updateLocation: (lat: number, lon: number) => void;
  refreshUser: () => Promise<void>;
  updatePreference: (pref: 'Veg' | 'Non-Veg' | 'Both') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_LOCATION: Location = {
  latitude: 12.9716,
  longitude: 77.5946,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('curryconnect_token'));
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<Location>(DEFAULT_LOCATION);

  const logout = useCallback(() => {
    localStorage.removeItem('curryconnect_token');
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          // Keep default coordinates when GPS is unavailable.
        }
      );
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const fetchedUser = await authService.getMe();
        setUser(fetchedUser);
        if (fetchedUser.latitude && fetchedUser.longitude) {
          setUserLocation({
            latitude: fetchedUser.latitude,
            longitude: fetchedUser.longitude,
          });
        }
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [token, logout]);

  const login = async (credentials: { email: string; password: string }) => {
    const data = await authService.login(credentials);
    localStorage.setItem('curryconnect_token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    setUserLocation({
      latitude: data.user.latitude,
      longitude: data.user.longitude,
    });
  };

  const register = async (userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    latitude: number;
    longitude: number;
    preference: 'Veg' | 'Non-Veg' | 'Both';
  }) => {
    const data = await authService.register(userData);
    localStorage.setItem('curryconnect_token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    setUserLocation({
      latitude: data.user.latitude,
      longitude: data.user.longitude,
    });
  };

  const updateLocation = (lat: number, lon: number) => {
    setUserLocation({ latitude: lat, longitude: lon });
  };

  const refreshUser = async () => {
    const fetchedUser = await authService.getMe();
    setUser(fetchedUser);
    if (fetchedUser.latitude && fetchedUser.longitude) {
      setUserLocation({
        latitude: fetchedUser.latitude,
        longitude: fetchedUser.longitude,
      });
    }
  };

  const updatePreference = async (pref: 'Veg' | 'Non-Veg' | 'Both') => {
    const updatedUser = await authService.updateProfile({ preference: pref });
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        userLocation,
        login,
        register,
        logout,
        updateLocation,
        refreshUser,
        updatePreference,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
