import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { curryService } from '../services/curryService';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, CheckCircle } from 'lucide-react';
import LocationMapPicker from '../components/LocationMapPicker';

const Upload: React.FC = () => {
  const { userLocation } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<'Veg' | 'Non-Veg'>('Veg');
  const [restaurant, setRestaurant] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('servings');
  const [price, setPrice] = useState(0);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [pickupTime, setPickupTime] = useState('5:00 PM - 7:00 PM');
  
  // Set default freshness window to 6 hours from now
  const [freshHours, setFreshHours] = useState(6);
  
  const [lat, setLat] = useState(userLocation.latitude);
  const [lng, setLng] = useState(userLocation.longitude);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLat(userLocation.latitude);
    setLng(userLocation.longitude);
  }, [userLocation.latitude, userLocation.longitude]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Calculate absolute timestamp for fresh_until
    const freshUntilDate = new Date();
    freshUntilDate.setHours(freshUntilDate.getHours() + Number(freshHours));

    const curryData = {
      name,
      category,
      quantity: Number(quantity),
      unit,
      price: Number(price),
      description,
      image_url: imageUrl || undefined,
      restaurant: restaurant || undefined,
      latitude: lat,
      longitude: lng,
      fresh_until: freshUntilDate.toISOString(),
      pickup_time: pickupTime
    };

    try {
      await curryService.createCurry(curryData);
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to list curry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 px-6 py-8 max-w-4xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-neutral-100"
      >
        <div className="mb-6">
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-neutral-850 m-0">Share Homemade Curry</h1>
          <p className="text-sm text-neutral-500 mt-1">Upload details of your extra homemade curry to share with neighbors.</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 mb-6 rounded-2xl bg-red-50 text-red-700 text-sm border border-red-100">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-4 mb-6 rounded-2xl bg-green-50 text-green-700 text-sm border border-green-100 font-semibold">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>Curry shared successfully! Redirecting...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2">Curry Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Authentic Kerala Chicken Curry"
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2">Restaurant / Kitchen Name</label>
                <input
                  type="text"
                  required
                  value={restaurant}
                  onChange={(e) => setRestaurant(e.target.value)}
                  placeholder="e.g., Grand Curry Palace or Homemade Kitchen"
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as 'Veg' | 'Non-Veg')}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all text-sm cursor-pointer"
                  >
                    <option value="Veg">Veg</option>
                    <option value="Non-Veg">Non-Veg</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2">Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    placeholder="0 for Free"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2">Unit</label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="e.g., servings, plates"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2">Fresh For (Hours)</label>
                  <input
                    type="number"
                    min="1"
                    max="48"
                    required
                    value={freshHours}
                    onChange={(e) => setFreshHours(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2">Pickup Time</label>
                  <input
                    type="text"
                    required
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    placeholder="e.g., 6:00 PM - 8:00 PM"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2">Image URL (Optional)</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/curry.jpg"
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Tell your neighbors about spices, ingredients, or allergens (e.g., contains nuts, medium spicy)..."
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all text-sm"
                />
              </div>
            </div>

            {/* Right side Location Map */}
            <div className="flex flex-col h-full min-h-[350px]">
              <div className="mb-2">
                <span className="block text-xs font-bold text-neutral-600 uppercase tracking-wider">Specify Pickup Location</span>
                <p className="text-xs text-neutral-400">Click on the map or drag the pin to set the exact pickup coordinates.</p>
              </div>

              <LocationMapPicker
                latitude={lat}
                longitude={lng}
                onLocationChange={(nextLat, nextLng) => {
                  setLat(nextLat);
                  setLng(nextLng);
                }}
                showGpsButton={true}
                draggable={true}
                heightClass="min-h-[280px] h-[280px] md:flex-1"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold flex items-center justify-center gap-2 shadow-xl shadow-brand-500/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 text-sm"
          >
            {loading ? 'Submitting Curry...' : 'Share with Neighborhood'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Upload;
