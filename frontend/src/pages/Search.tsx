import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { curryService } from '../services/curryService';
import type { CurrySearchResult } from '../services/curryService';
import { Search as SearchIcon, Filter, MapPin, Navigation, RefreshCcw, AlertTriangle } from 'lucide-react';
import L from 'leaflet';
import CurryDetailModal from '../components/CurryDetailModal';

const CATEGORIES = ['All', 'Veg', 'Non-Veg'];

const Search: React.FC = () => {
  const { user, userLocation } = useAuth();
  
  // Search parameters
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [radiusKm, setRadiusKm] = useState(1.0); // Default 1 km radius
  const [freeOnly, setFreeOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);

  // Coordinate override for simulated search base
  const [searchLat, setSearchLat] = useState(userLocation.latitude);
  const [searchLng, setSearchLng] = useState(userLocation.longitude);

  const [results, setResults] = useState<CurrySearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedSearch, setExpandedSearch] = useState(false);
  const [ratingCurryId, setRatingCurryId] = useState<number | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  
  const [selectedCurryId, setSelectedCurryId] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Leaflet references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  // Fetch search results from API
  const fetchResults = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await curryService.searchCurries({
        lat: searchLat,
        lon: searchLng,
        radius_km: radiusKm,
        category: category === 'All' ? undefined : category,
        query: query || undefined,
      });

      // Filter by pricing/rating locally
      let filtered = data;
      if (freeOnly) {
        filtered = filtered.filter(item => item.curry.price === 0);
      }
      if (minRating > 0) {
        filtered = filtered.filter(item => {
          const rating = item.average_rating ?? item.curry.average_rating ?? 0;
          return rating >= minRating;
        });
      }

      setResults(filtered);
      setExpandedSearch(filtered.some(item => item.expanded_radius));
    } catch (err: unknown) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : 'Could not connect to CurryConnect API. Make sure the FastAPI server is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSearchLat(userLocation.latitude);
    setSearchLng(userLocation.longitude);
  }, [userLocation.latitude, userLocation.longitude]);

  const detectGpsLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSearchLat(position.coords.latitude);
        setSearchLng(position.coords.longitude);
      },
      () => setError('Could not detect GPS location. Click the map to set your search center.')
    );
  };

  // Initialize Map
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([searchLat, searchLng], 14);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO'
      }).addTo(mapRef.current);

      markersGroupRef.current = L.layerGroup().addTo(mapRef.current);

      // Create Custom User Location Icon (Pulsing Blue Ring)
      const userHtml = `<div class="relative w-6 h-6">
        <div class="absolute inset-0 rounded-full bg-blue-500 border-2 border-white shadow-lg animate-ping opacity-75"></div>
        <div class="absolute inset-1 rounded-full bg-blue-600 border-2 border-white shadow-inner"></div>
      </div>`;
      
      const userIcon = L.divIcon({
        html: userHtml,
        className: 'user-location-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      userMarkerRef.current = L.marker([searchLat, searchLng], {
        icon: userIcon,
        zIndexOffset: 1000,
        draggable: true,
      }).addTo(mapRef.current);

      userMarkerRef.current.on('dragend', () => {
        const position = userMarkerRef.current?.getLatLng();
        if (position) {
          setSearchLat(position.lat);
          setSearchLng(position.lng);
        }
      });

      // User location circle
      radiusCircleRef.current = L.circle([searchLat, searchLng], {
        radius: radiusKm * 1000,
        color: '#f97316',
        fillColor: '#f97316',
        fillOpacity: 0.08,
        weight: 1.5,
        dashArray: '5, 5'
      }).addTo(mapRef.current);

      // Map click to change simulated location coordinates
      mapRef.current.on('click', (e) => {
        const { lat: clickedLat, lng: clickedLng } = e.latlng;
        setSearchLat(clickedLat);
        setSearchLng(clickedLng);
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        userMarkerRef.current = null;
        radiusCircleRef.current = null;
        markersGroupRef.current = null;
      }
    };
  }, []);

  // Update Map search base and radius circle
  useEffect(() => {
    if (mapRef.current && userMarkerRef.current && radiusCircleRef.current) {
      userMarkerRef.current.setLatLng([searchLat, searchLng]);
      radiusCircleRef.current.setLatLng([searchLat, searchLng]);
      radiusCircleRef.current.setRadius(radiusKm * 1000);
      
      // Auto-pan to center
      mapRef.current.panTo([searchLat, searchLng]);
    }
    fetchResults();
  }, [searchLat, searchLng, radiusKm, category, freeOnly, minRating, user?.preference]);

  // Update Curry markers on Map
  useEffect(() => {
    if (!mapRef.current || !markersGroupRef.current) return;

    // Clear previous markers
    markersGroupRef.current.clearLayers();

    const layerGroup = markersGroupRef.current;

    results.forEach((item) => {
      const curry = item.curry;
      const isSelected = curry.id === selectedCurryId;
      
      // Custom colored curry marker using HTML
      const markerHtml = `<div class="relative w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white shadow-md cursor-pointer transition-all duration-300 ${
        isSelected ? 'bg-sharing-500 scale-120 z-50' : 'bg-brand-500 hover:bg-brand-600'
      }">
        <span class="text-xs font-bold font-display">${curry.name.substring(0, 2).toUpperCase()}</span>
      </div>`;

      const curryIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-curry-pin',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([curry.latitude, curry.longitude], { icon: curryIcon });

      marker.on('click', () => {
        setSelectedCurryId(curry.id);
        setIsDetailOpen(true);
      });

      layerGroup.addLayer(marker);
    });
  }, [results, selectedCurryId]);

  const selectCurry = (curry: any) => {
    setSelectedCurryId(curry.id);
    setIsDetailOpen(true);
    if (mapRef.current) {
      mapRef.current.setView([curry.latitude, curry.longitude], 15);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResults();
  };

  const resetSearchBase = () => {
    setSearchLat(userLocation.latitude);
    setSearchLng(userLocation.longitude);
  };

  const handleRateCurry = async (curryId: number) => {
    try {
      await curryService.rateCurry(curryId, { rating: ratingValue });
      setRatingCurryId(null);
      fetchResults();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit rating.');
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-76px)] overflow-hidden w-full">
      {/* Left Panel: Filters and Results (Scrollable) */}
      <div className="w-full md:w-[450px] bg-white border-r border-neutral-200 flex flex-col h-1/2 md:h-full">
        {/* Filter Section */}
        <div className="p-5 border-b border-neutral-100 space-y-4 shrink-0 bg-neutral-cream/35">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search homemade curry..."
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-100 border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/25 text-sm"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl text-sm font-bold flex items-center justify-center cursor-pointer shadow-md shadow-brand-500/10 active:scale-95 transition-all"
            >
              Search
            </button>
          </form>

          {/* Dynamic radius and category sliders */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-neutral-600">
              <span className="flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                Radius: {radiusKm.toFixed(1)} km
              </span>
              {(searchLat !== userLocation.latitude || searchLng !== userLocation.longitude) && (
                <button 
                  onClick={resetSearchBase}
                  className="text-brand-600 hover:text-brand-700 flex items-center gap-0.5"
                >
                  <RefreshCcw className="w-3 h-3" /> Reset Location
                </button>
              )}
            </div>
            <input
              type="range"
              min="0.5"
              max="5.0"
              step="0.5"
              value={radiusKm}
              onChange={(e) => setRadiusKm(parseFloat(e.target.value))}
              className="w-full accent-brand-500 h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer"
            />

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-500 mb-1">Dietary Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2 bg-neutral-100 border-none rounded-xl focus:outline-none text-neutral-700 font-medium"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-neutral-500 mb-1">Min Rating</label>
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  className="w-full p-2 bg-neutral-100 border-none rounded-xl focus:outline-none text-neutral-700 font-medium"
                >
                  <option value={0}>Any rating</option>
                  <option value={4}>4+ Stars</option>
                  <option value={4.5}>4.5+ Stars</option>
                </select>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="free"
                checked={freeOnly}
                onChange={(e) => setFreeOnly(e.target.checked)}
                className="w-4 h-4 text-brand-500 border-neutral-300 rounded focus:ring-brand-500 focus:ring-2"
              />
              <label htmlFor="free" className="ml-2 text-xs font-bold text-neutral-600 select-none">Show FREE Shares Only</label>
            </div>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {expandedSearch && (
            <div className="p-3 bg-blue-50 border border-blue-100 text-blue-700 text-xs rounded-2xl">
              No exact matches within 1 km. Results expanded to 3 km or similar curries.
            </div>
          )}

          {error && (
            <div className="p-4 bg-amber-50 border border-amber-100 text-amber-700 text-xs rounded-2xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 bg-neutral-50 border border-neutral-100 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-neutral-500 flex flex-col items-center">
              <MapPin className="w-8 h-8 text-neutral-300 mb-2" />
              <p className="text-sm font-bold">No curries match your filters</p>
              <p className="text-xs text-neutral-400 mt-1">Try expanding the distance radius or changing categories.</p>
            </div>
          ) : (
            results.map((item) => {
              const curry = item.curry;
              const isSelected = curry.id === selectedCurryId;
              const avgRating = item.average_rating ?? item.curry.average_rating ?? 5;
              
              const formattedPrice = curry.price === 0 ? 'FREE' : `₹${curry.price}`;

              return (
                <div
                  key={curry.id}
                  onClick={() => selectCurry(curry)}
                  className={`p-4 rounded-2xl border transition-all duration-300 flex gap-4 cursor-pointer hover:border-brand-300 ${
                    isSelected 
                      ? 'border-sharing-500 bg-sharing-50/40 shadow-md shadow-sharing-500/5' 
                      : 'border-neutral-150 bg-white shadow-sm'
                  }`}
                >
                  <div className="w-20 h-20 bg-neutral-100 rounded-xl overflow-hidden shrink-0">
                    <img
                      src={curry.image_url || `https://images.unsplash.com/photo-1547825407-2d060104b7f8?auto=format&fit=crop&w=150&q=80`}
                      alt={curry.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <h4 className="font-display font-bold text-sm text-neutral-850 truncate leading-snug">{curry.name}</h4>
                        <span className="text-xs font-extrabold text-neutral-900 shrink-0">{formattedPrice}</span>
                      </div>
                      <p className="text-xs text-neutral-400 line-clamp-1 mt-0.5">By {curry.owner?.name || 'Chef'}</p>
                    </div>

                    <div className="flex justify-between items-center text-[11px] font-semibold text-neutral-500 mt-2">
                      <span className="flex items-center gap-0.5 text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-full text-[10px]">
                        {curry.category}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Navigation className="w-3 h-3 text-neutral-400" />
                        {(item.distance_meters / 1000).toFixed(2)} km
                      </span>
                      <span>Qty: {curry.quantity}</span>
                      <span className="flex items-center gap-0.5 text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">
                        ★ {avgRating.toFixed(1)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-neutral-400">
                        ML match: {Math.round((item.content_similarity ?? 0) * 100)}%
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRatingCurryId(curry.id);
                          setRatingValue(5);
                        }}
                        className="text-[10px] font-bold text-brand-600 hover:text-brand-700"
                      >
                        Rate
                      </button>
                    </div>
                    {ratingCurryId === curry.id && (
                      <div
                        className="mt-2 flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          value={ratingValue}
                          onChange={(e) => setRatingValue(Number(e.target.value))}
                          className="text-xs p-1 rounded border border-neutral-200"
                        >
                          {[5, 4, 3, 2, 1].map((value) => (
                            <option key={value} value={value}>{value} stars</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleRateCurry(curry.id)}
                          className="text-xs px-2 py-1 bg-brand-500 text-white rounded-lg"
                        >
                          Submit
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Panel: Map Container */}
      <div className="flex-1 relative h-1/2 md:h-full w-full bg-neutral-100">
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full"></div>
        {/* Floating coordinate helper */}
        <div className="absolute top-4 right-4 z-[500] bg-white/90 backdrop-blur border border-neutral-200/80 px-4 py-2.5 rounded-2xl text-xs font-semibold shadow-md flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>Search center:</span>
          </div>
          <span>{searchLat.toFixed(4)}, {searchLng.toFixed(4)}</span>
          <button
            type="button"
            onClick={detectGpsLocation}
            className="px-2 py-1 bg-brand-100 text-brand-700 rounded-lg hover:bg-brand-200"
          >
            Use GPS
          </button>
        </div>
        <div className="absolute bottom-4 left-4 z-[500] bg-white/90 backdrop-blur border border-neutral-200/80 px-3 py-2 rounded-xl text-[11px] text-neutral-600 shadow-md">
          Click map or drag blue pin to choose location
        </div>
      </div>

      <CurryDetailModal
        curryId={selectedCurryId}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedCurryId(null);
        }}
        currentUserId={user?.id}
        onBookingSuccess={fetchResults}
      />
    </div>
  );
};

export default Search;
