import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyticsService } from '../services/analyticsService';
import { curryService } from '../services/curryService';
import type { CurrySearchResult } from '../services/curryService';
import { motion } from 'framer-motion';
import { 
  Flame, PlusCircle, Search, Map, User, TrendingUp, Sparkles, Clock, 
  MapPin, Award, Trash2 
} from 'lucide-react';
import CurryDetailModal from '../components/CurryDetailModal';

const Dashboard: React.FC = () => {
  const { user, userLocation } = useAuth();

  const [stats, setStats] = useState({
    total_uploaded: 0,
    nearby_count: 0,
    today_searches: 0,
    waste_prevented_servings: 0,
  });
  const [recommendations, setRecommendations] = useState<CurrySearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCurryId, setSelectedCurryId] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch stats
        const statsData = await analyticsService.getStats(userLocation.latitude, userLocation.longitude);
        setStats(statsData);

        // Fetch top recommendations
        const recData = await curryService.searchCurries({
          lat: userLocation.latitude,
          lon: userLocation.longitude,
          radius_km: 5.0 // broader search for recommendations
        });
        setRecommendations(recData.slice(0, 4)); // Show top 4
      } catch (err: any) {
        console.error('Failed to load dashboard data:', err);
        setError('Could not load recommendation data. Make sure the backend server is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [userLocation, user?.preference]);

  return (
    <div className="flex-1 px-6 py-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-brand-600 to-brand-500 rounded-3xl p-8 text-white shadow-xl shadow-brand-500/20">
        <div>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl tracking-tight m-0 text-white">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-white/80 text-sm md:text-base mt-2 max-w-xl">
            You're near coordinates {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}. Find or share homemade meals with neighbors nearby.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/upload"
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-brand-600 hover:bg-brand-50 font-bold active:scale-95 transition-all text-sm cursor-pointer shadow-md shadow-brand-900/10"
          >
            <PlusCircle className="w-5 h-5" />
            Share Curry
          </Link>
          <Link
            to="/search"
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand-700/40 text-white hover:bg-brand-700/60 font-bold active:scale-95 transition-all text-sm cursor-pointer border border-white/10"
          >
            <Search className="w-5 h-5" />
            Search Curries
          </Link>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          {
            title: 'Nearby Curries',
            value: stats.nearby_count,
            desc: 'Within 5 km radius',
            icon: MapPin,
            color: 'text-brand-500 bg-brand-100',
          },
          {
            title: 'Today\'s Searches',
            value: stats.today_searches,
            desc: 'Searches in your region',
            icon: Search,
            color: 'text-sharing-600 bg-sharing-100',
          },
          {
            title: 'My Listings',
            value: stats.total_uploaded,
            desc: 'Total shared by you',
            icon: Flame,
            color: 'text-amber-600 bg-amber-100',
          },
          {
            title: 'Waste Prevented',
            value: `${stats.waste_prevented_servings} servings`,
            desc: 'Food waste saved',
            icon: Trash2,
            color: 'text-blue-600 bg-blue-100',
          },
        ].map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-5 md:p-6 rounded-3xl border border-neutral-100 shadow-sm flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              <span className="text-sm font-semibold text-neutral-500">{item.title}</span>
              <div className={`p-3 rounded-2xl ${item.color}`}>
                <item.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="font-display font-extrabold text-2xl md:text-3xl text-neutral-850">
                {item.value}
              </h3>
              <p className="text-xs text-neutral-400 mt-1">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Upload Curry', icon: PlusCircle, path: '/upload', color: 'hover:border-brand-500 hover:text-brand-500' },
          { label: 'Find Nearby Map', icon: Map, path: '/search', color: 'hover:border-sharing-500 hover:text-sharing-500' },
          { label: 'Analytics & ML', icon: TrendingUp, path: '/analytics', color: 'hover:border-blue-500 hover:text-blue-500' },
          { label: 'My Profile', icon: User, path: '/profile', color: 'hover:border-amber-500 hover:text-amber-500' }
        ].map((act, idx) => (
          <Link
            key={idx}
            to={act.path}
            className={`bg-white p-5 rounded-3xl border border-neutral-200/60 shadow-sm hover:shadow-md flex flex-col items-center justify-center gap-3 transition-all duration-300 group cursor-pointer ${act.color}`}
          >
            <div className="p-3 bg-neutral-50 rounded-2xl group-hover:scale-105 transition-transform">
              <act.icon className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold">{act.label}</span>
          </Link>
        ))}
      </div>

      {/* Recommendations Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-500 animate-bounce" />
            <h2 className="font-display font-extrabold text-xl md:text-2xl text-neutral-850 m-0">
              Curry Recommendations For You
            </h2>
          </div>
          <Link to="/search" className="text-sm text-brand-600 hover:text-brand-700 font-bold flex items-center gap-1">
            See all curries <Search className="w-3.5 h-3.5" />
          </Link>
        </div>

        {error && (
          <div className="p-6 bg-amber-50 border border-amber-200 rounded-3xl text-sm text-amber-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-3xl h-[320px] animate-pulse border border-neutral-100"></div>
            ))}
          </div>
        ) : recommendations.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-neutral-100 shadow-sm flex flex-col items-center">
            <div className="p-4 bg-brand-50 text-brand-500 rounded-3xl mb-4">
              <Flame className="w-8 h-8" />
            </div>
            <h3 className="font-display font-bold text-lg text-neutral-800">No curries nearby yet</h3>
            <p className="text-neutral-500 text-sm mt-1 max-w-sm">
              Be the first to share a warm meal in your neighborhood! Click "Share Curry" to list your available dishes.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendations.map((item, index) => {
              const curry = item.curry;
              const formattedPrice = curry.price === 0 ? 'FREE' : `₹${curry.price}`;
              
              return (
                <motion.div
                  key={curry.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => {
                    setSelectedCurryId(curry.id);
                    setIsDetailOpen(true);
                  }}
                  className="bg-white rounded-3xl overflow-hidden border border-neutral-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group cursor-pointer"
                >
                  {/* Image container */}
                  <div className="h-44 bg-neutral-100 relative overflow-hidden">
                    <img
                      src={curry.image_url || `https://images.unsplash.com/photo-1547825407-2d060104b7f8?auto=format&fit=crop&w=400&q=80`}
                      alt={curry.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-brand-500" />
                      <span>{curry.pickup_time}</span>
                    </div>
                    {/* Score badge */}
                    <div className="absolute top-3 right-3 bg-brand-500 text-white px-3 py-1 rounded-full text-xs font-extrabold shadow-md flex items-center gap-0.5">
                      <Award className="w-3.5 h-3.5" />
                      <span>Score: {Math.round(item.recommendation_score * 100)}</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full uppercase tracking-wide">
                          {curry.category}
                        </span>
                        <span className="font-extrabold text-neutral-850">
                          {formattedPrice}
                        </span>
                      </div>
                      <h4 className="font-display font-bold text-lg text-neutral-800 mt-3 line-clamp-1">
                        {curry.name}
                      </h4>
                      <p className="text-neutral-500 text-xs mt-1 line-clamp-2">
                        {curry.description || "Freshly cooked homemade curry ready for pickup. Contact owner."}
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-neutral-100 flex justify-between items-center text-xs font-semibold text-neutral-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                        {(item.distance_meters / 1000).toFixed(2)} km
                      </span>
                      <span>
                        Qty: {curry.quantity} {curry.unit}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <CurryDetailModal
        curryId={selectedCurryId}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedCurryId(null);
        }}
        currentUserId={user?.id}
        onBookingSuccess={() => {
          // Re-fetch dashboard stats and recommendations
          const fetchDashboardData = async () => {
            const statsData = await analyticsService.getStats(userLocation.latitude, userLocation.longitude);
            setStats(statsData);
            const recData = await curryService.searchCurries({
              lat: userLocation.latitude,
              lon: userLocation.longitude,
              radius_km: 5.0
            });
            setRecommendations(recData.slice(0, 4));
          };
          fetchDashboardData().catch(console.error);
        }}
      />
    </div>
  );
};

export default Dashboard;
