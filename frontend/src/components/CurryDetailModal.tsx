import React, { useState, useEffect } from 'react';
import { curryService } from '../services/curryService';
import type { Curry } from '../services/curryService';
import { X, MapPin, Phone, CheckCircle, Navigation, Calendar, AlertTriangle, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CurryDetailModalProps {
  curryId: number | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: number;
  onBookingSuccess?: () => void;
}

const CurryDetailModal: React.FC<CurryDetailModalProps> = ({
  curryId,
  isOpen,
  onClose,
  currentUserId,
  onBookingSuccess
}) => {
  const [curry, setCurry] = useState<Curry | null>(null);
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen && curryId) {
      fetchCurryDetails();
    } else {
      setCurry(null);
      setError('');
      setSuccess('');
    }
  }, [isOpen, curryId]);

  const fetchCurryDetails = async () => {
    if (!curryId) return;
    setLoading(true);
    setError('');
    try {
      const data = await curryService.getCurryById(curryId);
      setCurry(data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load curry details.');
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!curry) return;
    setBookingLoading(true);
    setError('');
    setSuccess('');
    try {
      const updated = await curryService.bookCurry(curry.id);
      setCurry(updated);
      setSuccess('You have successfully booked this curry! 🎉');
      if (onBookingSuccess) {
        onBookingSuccess();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to book curry. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
        />

        {/* Modal content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="relative bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-neutral-100 flex flex-col max-h-[90vh]"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur hover:bg-white text-neutral-600 flex items-center justify-center shadow transition-all border border-neutral-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-semibold text-neutral-500">Loading curry details...</p>
            </div>
          ) : curry ? (
            <>
              {/* Curry Image Header */}
              <div className="h-52 w-full relative bg-neutral-100 shrink-0">
                <img
                  src={curry.image_url || 'https://images.unsplash.com/photo-1547825407-2d060104b7f8?auto=format&fit=crop&q=80&w=800'}
                  alt={curry.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-6 right-6 text-white flex justify-between items-end">
                  <div>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      curry.category === 'Veg' ? 'bg-sharing-500 text-white' : 'bg-brand-500 text-white'
                    }`}>
                      {curry.category}
                    </span>
                    <h3 className="font-display font-extrabold text-xl mt-1.5 leading-snug drop-shadow-sm">{curry.name}</h3>
                  </div>
                  <span className="font-display font-extrabold text-xl bg-white/20 backdrop-blur px-3 py-1 rounded-2xl drop-shadow-sm">
                    {curry.price === 0 ? 'FREE' : `₹${curry.price}`}
                  </span>
                </div>
              </div>

              {/* Scrollable details */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-xs border border-red-100 rounded-2xl">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                {success && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 text-xs border border-green-100 rounded-2xl font-bold">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>{success}</span>
                  </div>
                )}

                {/* Chef / Kitchen Description */}
                <div>
                  <h4 className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Chef & Kitchen</h4>
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50 border border-neutral-150">
                    <div>
                      <h5 className="font-display font-bold text-sm text-neutral-800">{curry.owner?.name || 'Home Chef'}</h5>
                      {curry.restaurant && (
                        <p className="text-[11px] text-brand-600 font-semibold mt-0.5">📍 {curry.restaurant}</p>
                      )}
                    </div>
                    {curry.owner?.rating && (
                      <span className="flex items-center gap-0.5 text-xs font-extrabold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-lg border border-brand-100 shrink-0">
                        ★ {curry.owner.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Logistics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-2xl border border-neutral-150 bg-neutral-50/50">
                    <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Available Qty</span>
                    <span className="font-display font-extrabold text-sm text-neutral-800">{curry.quantity} {curry.unit}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl border border-neutral-150 bg-neutral-50/50">
                    <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Pickup Time</span>
                    <span className="font-display font-bold text-sm text-neutral-850 truncate block">{curry.pickup_time}</span>
                  </div>
                </div>

                {/* Fresh until */}
                <div className="flex items-center gap-2 text-xs text-neutral-500 bg-neutral-50/50 p-3 rounded-2xl border border-neutral-150">
                  <Calendar className="w-4 h-4 text-neutral-400" />
                  <span>Fresh Until: <strong>{new Date(curry.fresh_until).toLocaleString()}</strong></span>
                </div>

                {/* Description */}
                {curry.description && (
                  <div>
                    <h4 className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Description</h4>
                    <p className="text-sm text-neutral-600 leading-relaxed font-medium bg-neutral-50/30 p-3.5 rounded-2xl border border-neutral-150/70">{curry.description}</p>
                  </div>
                )}

                {/* Booking status & Navigation */}
                {curry.booked_by_id ? (
                  curry.booked_by_id === currentUserId ? (
                    <div className="p-4 rounded-3xl bg-green-50 border border-green-150 space-y-3">
                      <div className="flex items-center gap-2 text-green-800 font-bold text-sm">
                        <CheckCircle className="w-5 h-5 shrink-0" />
                        <span>Pickup Instructions & Navigation</span>
                      </div>
                      <p className="text-xs text-green-700 leading-normal">
                        Your booking is confirmed! Please contact the chef directly or use the coordinates below to navigate to their home location.
                      </p>
                      <div className="pt-2 border-t border-green-150 space-y-2 text-xs text-green-800 font-semibold">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-green-600" />
                          <span>Phone: <strong>{curry.owner?.phone || 'No phone provided'}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-green-600" />
                          <span>Coordinates: <strong>{curry.latitude.toFixed(5)}, {curry.longitude.toFixed(5)}</strong></span>
                        </div>
                      </div>

                      {/* Google Maps directions */}
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${curry.latitude},${curry.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full mt-3 py-3 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-600/20 transition-all active:scale-[0.98] cursor-pointer text-xs"
                      >
                        <Navigation className="w-4 h-4 animate-pulse" />
                        Navigate with Google Maps
                      </a>
                    </div>
                  ) : curry.user_id === currentUserId ? (
                    <div className="p-4 rounded-3xl bg-blue-50 border border-blue-150 space-y-3">
                      <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
                        <CheckCircle className="w-5 h-5 shrink-0" />
                        <span>Booked by a Neighbor! 🎉</span>
                      </div>
                      <p className="text-xs text-blue-700 leading-normal">
                        This curry has been successfully reserved. Please coordinate with the recipient directly using their details below:
                      </p>
                      <div className="pt-2 border-t border-blue-150 space-y-2 text-xs text-blue-800 font-semibold">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-blue-600" />
                          <span>Booked By: <strong>{curry.booked_by_name || 'Neighbor'}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-blue-600" />
                          <span>Recipient Contact: <strong>{curry.booked_by_phone || 'No phone provided'}</strong></span>
                        </div>
                      </div>
                      {/* Google Maps directions */}
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${curry.latitude},${curry.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full mt-3 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] cursor-pointer text-xs"
                      >
                        <Navigation className="w-4 h-4" />
                        Directions to Recipient Location
                      </a>
                    </div>
                  ) : (
                    <div className="p-3 bg-neutral-100 border border-neutral-200 rounded-2xl text-center text-neutral-500 font-bold text-xs">
                      🔒 This curry has already been reserved by another neighbor.
                    </div>
                  )
                ) : null}
              </div>

              {/* Modal Footer / Call to action */}
              {!curry.booked_by_id && (
                <div className="p-6 border-t border-neutral-100 shrink-0 bg-neutral-50/50 flex justify-between gap-4 items-center">
                  <div className="text-left">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Grand Total</span>
                    <span className="font-display font-extrabold text-xl text-neutral-850">
                      {curry.price === 0 ? 'FREE' : `₹${curry.price}`}
                    </span>
                  </div>
                  <button
                    onClick={handleBook}
                    disabled={bookingLoading}
                    className="flex-1 py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-xl shadow-brand-500/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {bookingLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Navigation className="w-4 h-4" />
                        Confirm Booking
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-neutral-500 font-semibold text-sm">Curry details could not be found.</div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CurryDetailModal;
