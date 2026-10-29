import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapPin } from 'lucide-react';

interface LocationMapPickerProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number) => void;
  zoom?: number;
  heightClass?: string;
  showGpsButton?: boolean;
  draggable?: boolean;
  markerLabel?: string;
}

const LocationMapPicker: React.FC<LocationMapPickerProps> = ({
  latitude,
  longitude,
  onLocationChange,
  zoom = 14,
  heightClass = 'min-h-[280px] h-[280px]',
  showGpsButton = true,
  draggable = true,
  markerLabel = 'Drag or click the map to set location',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const detectingRef = useRef(false);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = L.map(mapContainerRef.current).setView([latitude, longitude], zoom);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(mapRef.current);

    markerRef.current = L.marker([latitude, longitude], {
      draggable,
      icon: L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      }),
    }).addTo(mapRef.current);

    if (draggable) {
      markerRef.current.on('dragend', () => {
        const position = markerRef.current?.getLatLng();
        if (position) {
          onLocationChange(position.lat, position.lng);
        }
      });
    }

    mapRef.current.on('click', (e) => {
      const { lat, lng } = e.latlng;
      onLocationChange(lat, lng);
      markerRef.current?.setLatLng([lat, lng]);
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (mapRef.current && markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
      mapRef.current.setView([latitude, longitude], mapRef.current.getZoom());
    }
  }, [latitude, longitude]);

  const detectGps = () => {
    if (detectingRef.current || !navigator.geolocation) return;
    detectingRef.current = true;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocationChange(position.coords.latitude, position.coords.longitude);
        detectingRef.current = false;
      },
      () => {
        detectingRef.current = false;
      }
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center gap-2">
        <p className="text-xs text-neutral-400">{markerLabel}</p>
        {showGpsButton && (
          <button
            type="button"
            onClick={detectGps}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-100 hover:bg-brand-200 text-brand-700 rounded-xl text-xs font-semibold active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <MapPin className="w-3.5 h-3.5" />
            Use GPS
          </button>
        )}
      </div>
      <div
        ref={mapContainerRef}
        className={`w-full rounded-2xl overflow-hidden border border-neutral-200 shadow-inner ${heightClass}`}
      />
      <div className="flex items-center gap-4 text-xs font-semibold text-neutral-500 self-center">
        <span>Lat: {latitude.toFixed(5)}</span>
        <span>Lng: {longitude.toFixed(5)}</span>
      </div>
    </div>
  );
};

export default LocationMapPicker;
