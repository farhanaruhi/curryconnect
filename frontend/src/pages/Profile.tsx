import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { curryService } from '../services/curryService';
import type { Curry } from '../services/curryService';
import LocationMapPicker from '../components/LocationMapPicker';
import CurryDetailModal from '../components/CurryDetailModal';
import { motion } from 'framer-motion';
import { User, Phone, Mail, MapPin, Award, Trash2, ShieldAlert, Save, History } from 'lucide-react';

interface SearchHistoryItem {
  id: number;
  query?: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

const Profile: React.FC = () => {
  const { user, userLocation, updateLocation, refreshUser, updatePreference, logout } = useAuth();
  
  const [myCurries, setMyCurries] = useState<Curry[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [availableMenuCurries, setAvailableMenuCurries] = useState<any[]>([]);
  const [selectedCurryId, setSelectedCurryId] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [lat, setLat] = useState(user?.latitude ?? userLocation.latitude);
  const [lng, setLng] = useState(user?.longitude ?? userLocation.longitude);
  const [loading, setLoading] = useState(true);
  const [savingLocation, setSavingLocation] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchMenuCurries = async () => {
    try {
      const data = await curryService.searchCurries({
        lat: userLocation.latitude,
        lon: userLocation.longitude,
        radius_km: 20.0
      });
      setAvailableMenuCurries(data);
    } catch (e) {
      console.error('Failed to fetch menu curries:', e);
    }
  };

  const fetchMyListings = async () => {
    try {
      const [all, history] = await Promise.all([
        curryService.getAllCurries(),
        authService.getSearchHistory(),
      ]);
      if (user) {
        setMyCurries(all.filter(c => c.user_id === user.id));
      }
      setSearchHistory(history);
    } catch (e) {
      console.error(e);
      setError('Could not retrieve your profile data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      setLat(user.latitude);
      setLng(user.longitude);
      fetchMenuCurries();
    }
    fetchMyListings();
  }, [user, user?.preference]);

  const handleDeleteListing = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        await curryService.deleteCurry(id);
        setMyCurries(prev => prev.filter(c => c.id !== id));
      } catch {
        alert('Failed to delete listing.');
      }
    }
  };

  const handleTogglePreference = async (newPref: 'Veg' | 'Non-Veg' | 'Both') => {
    setError('');
    setSuccess('');
    try {
      await updatePreference(newPref);
      setSuccess(`Preference updated to ${newPref} successfully.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update preference.');
    }
  };

  const handleSaveLocation = async () => {
    setSavingLocation(true);
    setError('');
    setSuccess('');
    try {
      await authService.updateProfile({ latitude: lat, longitude: lng });
      updateLocation(lat, lng);
      await refreshUser();
      setSuccess('Home location updated successfully.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update location.');
    } finally {
      setSavingLocation(false);
    }
  };

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-neutral-500 font-semibold">
        Please log in to view your profile.
      </div>
    );
  }

  return (
    <div className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-8">
      <motion.div
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        className="md:col-span-1 bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm h-fit space-y-6"
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mb-4">
            <User className="w-12 h-12" />
          </div>
          <h2 className="font-display font-extrabold text-xl text-neutral-850 m-0">{user.name}</h2>
          <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full mt-2">
            Chef Rating: ★ {user.rating.toFixed(1)}
          </span>
        </div>

        <div className="border-t border-neutral-100 pt-6 space-y-4 text-sm font-semibold text-neutral-600">
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-neutral-400 shrink-0" />
            <span className="truncate">{user.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-neutral-400 shrink-0" />
            <span>{user.phone || 'No phone provided'}</span>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-neutral-400 shrink-0" />
            <span className="truncate">Lat: {lat.toFixed(4)}, Lng: {lng.toFixed(4)}</span>
          </div>
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-neutral-400 shrink-0" />
            <span>Preference: {user.preference}</span>
          </div>
          <div className="flex items-center gap-3">
            <Award className="w-4 h-4 text-neutral-400 shrink-0" />
            <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Preference Card & Switcher */}
        <div className="border-t border-neutral-100 pt-6 space-y-3">
          <h3 className="font-display font-bold text-sm text-neutral-800">Preferred Menu</h3>
          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-150 flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-500">Current Preference:</span>
            <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${
              user.preference === 'Veg' 
                ? 'bg-sharing-100 text-sharing-700' 
                : user.preference === 'Non-Veg' 
                  ? 'bg-brand-100 text-brand-700' 
                  : 'bg-blue-100 text-blue-700'
            }`}>
              ✔ {user.preference}
            </span>
          </div>
          
          <div className="flex gap-1.5 flex-wrap sm:flex-nowrap">
            <button
              onClick={() => handleTogglePreference('Veg')}
              className={`flex-1 min-w-[70px] py-2 px-2.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                user.preference === 'Veg'
                  ? 'border-sharing-500 bg-sharing-50 text-sharing-700'
                  : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              Set Veg
            </button>
            <button
              onClick={() => handleTogglePreference('Non-Veg')}
              className={`flex-1 min-w-[70px] py-2 px-2.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                user.preference === 'Non-Veg'
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              Set Non-Veg
            </button>
            <button
              onClick={() => handleTogglePreference('Both')}
              className={`flex-1 min-w-[70px] py-2 px-2.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                user.preference === 'Both'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              Set Both
            </button>
          </div>
        </div>

        <div className="border-t border-neutral-100 pt-6 space-y-3">
          <h3 className="font-display font-bold text-sm text-neutral-800">Update Home Location</h3>
          <LocationMapPicker
            latitude={lat}
            longitude={lng}
            onLocationChange={(nextLat, nextLng) => {
              setLat(nextLat);
              setLng(nextLng);
            }}
            heightClass="min-h-[220px] h-[220px]"
          />
          <button
            type="button"
            onClick={handleSaveLocation}
            disabled={savingLocation}
            className="w-full py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {savingLocation ? 'Saving...' : 'Save Location'}
          </button>
          {success && <p className="text-xs text-green-600">{success}</p>}
        </div>

        {/* Logout Button */}
        <div className="border-t border-neutral-100 pt-6">
          <button
            onClick={logout}
            className="w-full py-3 rounded-2xl border border-red-200 text-red-600 hover:bg-red-50 font-bold active:scale-[0.98] transition-all text-sm cursor-pointer"
          >
            Log Out
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="md:col-span-2 space-y-6"
      >
        <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-brand-500" />
            <h3 className="font-display font-bold text-xl text-neutral-850 m-0">Recent Searches</h3>
          </div>
          {searchHistory.length === 0 ? (
            <p className="text-sm text-neutral-500">No search history yet. Try finding curries on the map.</p>
          ) : (
            <div className="space-y-2">
              {searchHistory.slice(0, 5).map((entry) => (
                <div key={entry.id} className="text-xs p-3 rounded-xl bg-neutral-50 text-neutral-600 flex justify-between gap-2">
                  <span>{entry.query || 'Nearby search'}</span>
                  <span>{new Date(entry.timestamp).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Menu-wise Curry List */}
        <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm space-y-6">
          <div>
            <h3 className="font-display font-bold text-xl text-neutral-850 m-0">
              Available {user.preference} Curries
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              Curries matching your preference listed in your neighborhood.
            </p>
          </div>

          {availableMenuCurries.length === 0 ? (
            <p className="text-sm text-neutral-500">No curries matching your preference are available right now.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {availableMenuCurries.map((item) => {
                const curry = item.curry;
                const formattedPrice = curry.price === 0 ? 'FREE' : `₹${curry.price}`;
                return (
                  <div
                    key={curry.id}
                    onClick={() => {
                      setSelectedCurryId(curry.id);
                      setIsDetailOpen(true);
                    }}
                    className="p-4 rounded-2xl border border-neutral-150 flex flex-col justify-between gap-3 bg-neutral-50/50 hover:border-brand-300 transition-all cursor-pointer"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <h4 className="font-display font-bold text-sm text-neutral-800 truncate">{curry.name}</h4>
                        <span className="text-xs font-extrabold text-neutral-900 shrink-0">{formattedPrice}</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-1 truncate">By {curry.owner?.name}</p>
                      {curry.restaurant && (
                        <p className="text-[10px] text-brand-600 font-semibold mt-0.5">📍 {curry.restaurant}</p>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-neutral-500 font-semibold pt-2 border-t border-neutral-100">
                      <span>Qty: {curry.quantity} {curry.unit}</span>
                      <span>{(item.distance_meters / 1000).toFixed(1)} km away</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm space-y-6">
          <div>
            <h3 className="font-display font-bold text-xl text-neutral-850 m-0">My Shared Curries</h3>
            <p className="text-xs text-neutral-500 mt-1">Manage listings that you have uploaded to CurryConnect.</p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-700 text-xs rounded-2xl flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="h-20 bg-neutral-50 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : myCurries.length === 0 ? (
            <div className="py-12 text-center text-neutral-500 border border-dashed border-neutral-200 rounded-2xl">
              <Award className="w-8 h-8 text-neutral-300 mx-auto mb-2 animate-bounce" />
              <p className="text-sm font-bold">You haven't shared any curries yet</p>
              <p className="text-xs text-neutral-400 mt-1">Cook some extra portions and share the warm food!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myCurries.map((curry) => {
                const formattedPrice = curry.price === 0 ? 'FREE' : `₹${curry.price}`;
                return (
                  <div
                    key={curry.id}
                    onClick={() => {
                      setSelectedCurryId(curry.id);
                      setIsDetailOpen(true);
                    }}
                    className="p-4 rounded-2xl border border-neutral-150 flex items-center justify-between gap-4 bg-neutral-50/50 hover:border-brand-300 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-neutral-100 rounded-xl overflow-hidden shrink-0">
                        <img
                          src={curry.image_url || `https://images.unsplash.com/photo-1547825407-2d060104b7f8?auto=format&fit=crop&w=100&q=80`}
                          alt={curry.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-sm text-neutral-800">{curry.name}</h4>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-500">
                          <span className="bg-neutral-200 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-extrabold">{curry.category}</span>
                          <span>Qty: {curry.quantity} {curry.unit}</span>
                          <span className="font-extrabold text-neutral-700">{formattedPrice}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteListing(curry.id);
                      }}
                      className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                      title="Delete Listing"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

      <CurryDetailModal
        curryId={selectedCurryId}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedCurryId(null);
        }}
        currentUserId={user?.id}
        onBookingSuccess={() => {
          fetchMyListings();
          fetchMenuCurries();
        }}
      />
    </div>
  );
};

export default Profile;
