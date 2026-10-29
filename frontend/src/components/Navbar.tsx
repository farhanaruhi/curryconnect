import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Compass, PlusCircle, LayoutDashboard, BarChart3, User, LogOut, Flame, Menu, X, Bell } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import type { NotificationItem } from '../services/notificationService';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getMyNotifications();
      setNotifications(data);
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    }
  };

  React.useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll notifications every 10 seconds for real-time bookings
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      fetchNotifications();
    } catch (e) {
      console.error('Failed to mark notification as read:', e);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinkClass = (path: string) =>
    `flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
      isActive(path)
        ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
        : 'text-neutral-700 hover:bg-brand-100 hover:text-brand-700'
    }`;

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/search', label: 'Find Curries', icon: Compass },
    { path: '/upload', label: 'Share Curry', icon: PlusCircle },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full glass border-b border-white/20 px-4 md:px-6 py-4 flex items-center justify-between shadow-sm">
      <Link to="/" className="flex items-center gap-2 group">
        <div className="bg-brand-500 p-2 rounded-2xl text-white group-hover:scale-105 transition-transform duration-300">
          <Flame className="w-6 h-6 animate-pulse" />
        </div>
        <span className="font-display font-extrabold text-xl tracking-tight text-brand-900">
          Curry<span className="text-brand-500">Connect</span>
        </span>
      </Link>

      {user && (
        <>
          <div className="hidden md:flex items-center gap-2">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link key={path} to={path} className={navLinkClass(path)}>
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          <button
            type="button"
            className="md:hidden p-2 rounded-xl border border-neutral-200 text-neutral-700"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </>
      )}

      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-3 relative">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="p-2 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-brand-600 transition-all cursor-pointer relative"
                aria-label="View notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0 animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-neutral-100 rounded-3xl shadow-xl z-[999] overflow-hidden">
                  <div className="p-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                    <span className="text-sm font-bold text-neutral-800">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] text-brand-600 font-bold bg-brand-50 px-2 py-0.5 rounded-lg border border-brand-100">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-neutral-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-neutral-400 font-semibold">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            if (!notif.read) handleMarkAsRead(notif.id);
                          }}
                          className={`p-4 text-left transition-colors cursor-pointer text-xs ${
                            notif.read ? 'bg-white hover:bg-neutral-50/50' : 'bg-brand-50/20 hover:bg-brand-50/30'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <span className="font-bold text-neutral-800">{notif.title}</span>
                            <span className="text-[9px] text-neutral-400 font-medium whitespace-nowrap">
                              {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-neutral-500 leading-normal font-medium">{notif.message}</p>
                          {!notif.read && (
                            <span className="inline-block mt-2 text-[9px] text-brand-600 font-bold hover:underline">
                              Mark as read
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <span className="text-sm font-semibold text-neutral-800 hidden sm:inline">
              Hi, {user.name}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border border-neutral-200 text-neutral-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-300 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-brand-500 text-white shadow-lg shadow-brand-500/25 hover:bg-brand-600 hover:shadow-brand-600/30 active:scale-95 transition-all duration-300"
            >
              Register
            </Link>
          </div>
        )}
      </div>

      {user && mobileOpen && (
        <div className="absolute top-full left-0 right-0 md:hidden bg-white border-b border-neutral-200 shadow-lg p-4 flex flex-col gap-2">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              onClick={() => setMobileOpen(false)}
              className={navLinkClass(path)}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
