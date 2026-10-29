import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { User, Lock, Mail, Phone, AlertTriangle, ArrowRight } from 'lucide-react';
import LocationMapPicker from '../components/LocationMapPicker';

const Register: React.FC = () => {
  const { register, userLocation } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [lat, setLat] = useState(userLocation.latitude);
  const [lng, setLng] = useState(userLocation.longitude);
  const [preference, setPreference] = useState<'Veg' | 'Non-Veg' | 'Both'>('Both');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLat(userLocation.latitude);
    setLng(userLocation.longitude);
  }, [userLocation.latitude, userLocation.longitude]);

  const getPasswordStrength = () => {
    if (!password) return { text: 'Empty', color: 'bg-neutral-200', score: 0 };
    let score = 0;
    if (password.length >= 6) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { text: 'Weak', color: 'bg-red-500', score };
    if (score === 2) return { text: 'Medium', color: 'bg-yellow-500', score };
    return { text: 'Strong', color: 'bg-green-500', score };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await register({
        name,
        email: email.trim().toLowerCase(),
        phone,
        latitude: lat,
        longitude: lng,
        password,
        preference
      });
      navigate('/');
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to register account. Please check your fields.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength();

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 bg-gradient-to-tr from-brand-100/50 via-brand-50 to-sharing-50/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl bg-white rounded-3xl p-8 shadow-2xl shadow-brand-900/5 border border-brand-100 flex flex-col md:flex-row gap-8"
      >
        {/* Registration Form (Left Side) */}
        <div className="flex-1 space-y-6">
          <div>
            <h2 className="font-display font-extrabold text-2xl text-brand-900">Create Account</h2>
            <p className="text-sm text-neutral-500 mt-1">Join the community and reduce food waste.</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 text-red-700 text-sm border border-red-100">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-11 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-11 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full pl-11 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all text-sm"
                />
              </div>
            </div>

            {/* Food Preference Selection */}
            <div>
              <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2">Food Preference</label>
              <div className="flex gap-2 sm:gap-4 flex-wrap sm:flex-nowrap">
                <label className={`flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-3 px-3 rounded-2xl border text-xs font-bold cursor-pointer transition-all duration-305 ${
                  preference === 'Veg'
                    ? 'border-sharing-500 bg-sharing-50 text-sharing-700 shadow-sm'
                    : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-600'
                }`}>
                  <input
                    type="radio"
                    name="preference"
                    value="Veg"
                    checked={preference === 'Veg'}
                    onChange={() => setPreference('Veg')}
                    className="sr-only"
                  />
                  <span>🟢 Veg</span>
                </label>
                <label className={`flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-3 px-3 rounded-2xl border text-xs font-bold cursor-pointer transition-all duration-305 ${
                  preference === 'Non-Veg'
                    ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm'
                    : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-600'
                }`}>
                  <input
                    type="radio"
                    name="preference"
                    value="Non-Veg"
                    checked={preference === 'Non-Veg'}
                    onChange={() => setPreference('Non-Veg')}
                    className="sr-only"
                  />
                  <span>🔴 Non-Veg</span>
                </label>
                <label className={`flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-3 px-3 rounded-2xl border text-xs font-bold cursor-pointer transition-all duration-305 ${
                  preference === 'Both'
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                    : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-600'
                }`}>
                  <input
                    type="radio"
                    name="preference"
                    value="Both"
                    checked={preference === 'Both'}
                    onChange={() => setPreference('Both')}
                    className="sr-only"
                  />
                  <span>🍲 Both</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all text-sm"
                  />
                </div>
                {/* Strength Meter */}
                {password && (
                  <div className="mt-2">
                    <div className="flex justify-between items-center text-xs text-neutral-500 mb-1">
                      <span>Password strength: <strong>{strength.text}</strong></span>
                    </div>
                    <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${strength.color} transition-all duration-300`}
                        style={{ width: `${(strength.score / 4) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all text-sm"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-4 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-semibold flex items-center justify-center gap-2 shadow-xl shadow-brand-500/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 text-sm"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-sm text-center text-neutral-600 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 hover:text-brand-700 font-semibold">Log In</Link>
          </p>
        </div>

        {/* Location Picker Map (Right Side) */}
        <div className="flex-1 flex flex-col min-h-[300px] md:min-h-full">
          <div className="mb-3">
            <span className="block text-xs font-bold text-neutral-600 uppercase tracking-wider">Set Home Coordinates</span>
            <p className="text-xs text-neutral-400">Click on the map or drag the marker to your home</p>
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
      </motion.div>
    </div>
  );
};

export default Register;
