import React, { useState } from 'react';
import { MapPin, Navigation, Compass, Bell, Shield, Play, RotateCcw } from 'lucide-react';
import type { GeofenceSettings } from '../types.js';
import { formatDistance } from '../utils/geo.js';

interface DepartureSimulatorProps {
  geofence: GeofenceSettings;
  currentDistance: number;
  isSimulating: boolean;
  onUpdateDistance: (distanceMeters: number) => void;
  onSetHomeLocation: (lat: number, lng: number) => void;
  onUpdateGeofence: (newSettings: Partial<GeofenceSettings>) => void;
  onTriggerSimulatedDeparture: () => void;
  onResetToHome: () => void;
  isRealGpsActive: boolean;
  onToggleRealGps: () => void;
}

export const DepartureSimulator: React.FC<DepartureSimulatorProps> = ({
  geofence,
  currentDistance,
  isSimulating,
  onUpdateDistance,
  onSetHomeLocation,
  onUpdateGeofence,
  onTriggerSimulatedDeparture,
  onResetToHome,
  isRealGpsActive,
  onToggleRealGps,
}) => {
  const [gpsError, setGpsError] = useState<string | null>(null);
  const radius = geofence.radiusMeters;
  const isOutsideGeofence = currentDistance >= radius;

  const handleGetCurrentGps = () => {
    if (!('geolocation' in navigator)) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onSetHomeLocation(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setGpsError(`GPS error: ${err.message}. You can still use the departure simulator!`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 space-y-6 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100 dark:border-stone-800">
        <div>
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 tracking-tight flex items-center gap-2">
            <MapPin className="w-5 h-5 text-stone-700 dark:text-stone-300" />
            Departure Geofence & Location Trigger
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Automatically sends a nagging notification the instant you leave your home perimeter with open checks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleRealGps}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 min-h-[44px] ${
              isRealGpsActive
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>{isRealGpsActive ? 'Live GPS Active' : 'Enable Live GPS'}</span>
          </button>
        </div>
      </div>

      {gpsError && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-200">
          {gpsError}
        </div>
      )}

      {/* Geofence Radar / Visual Gauge */}
      <div className="bg-stone-50 dark:bg-stone-950/60 rounded-xl p-5 border border-stone-200/80 dark:border-stone-800 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Radar Graphic */}
        <div className="relative w-48 h-48 rounded-full border-2 border-dashed border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 flex items-center justify-center shrink-0 shadow-inner">
          {/* Geofence boundary circle */}
          <div className="absolute inset-4 rounded-full border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/40 flex items-center justify-center">
            {/* Home Base */}
            <div className="w-8 h-8 rounded-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 flex items-center justify-center shadow-md">
              <Shield className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            </div>
          </div>

          {/* User position marker on radar */}
          <div
            className="absolute transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${50 + Math.min(44, (currentDistance / (radius * 1.5)) * 44)}%`,
              top: '50%',
            }}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shadow-md ring-4 ${
                isOutsideGeofence
                  ? 'bg-rose-600 text-white ring-rose-200 dark:ring-rose-950/60'
                  : 'bg-emerald-600 text-white ring-emerald-200 dark:ring-emerald-950/60'
              }`}
            >
              <Compass className="w-3.5 h-3.5 animate-spin-slow" />
            </div>
          </div>

          <div className="absolute bottom-2 text-[10px] font-mono text-stone-400 dark:text-stone-500">
            Perimeter: {radius}m
          </div>
        </div>

        {/* Status Metrics */}
        <div className="flex-1 w-full space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-stone-900 p-3.5 rounded-xl border border-stone-200 dark:border-stone-800">
              <div className="text-xs text-stone-500 dark:text-stone-400">Current Distance</div>
              <div className="text-2xl font-bold font-mono tabular-nums text-stone-900 dark:text-stone-100 mt-0.5">
                {formatDistance(currentDistance)}
              </div>
              <div className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">
                From home center point
              </div>
            </div>

            <div className="bg-white dark:bg-stone-900 p-3.5 rounded-xl border border-stone-200 dark:border-stone-800">
              <div className="text-xs text-stone-500 dark:text-stone-400">Departure Status</div>
              <div
                className={`text-lg font-bold mt-1 ${
                  isOutsideGeofence
                    ? 'text-rose-600 dark:text-rose-400'
                    : currentDistance > radius * 0.5
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-700 dark:text-emerald-400'
                }`}
              >
                {isOutsideGeofence
                  ? 'Outside Geofence (Away)'
                  : currentDistance > radius * 0.5
                  ? 'Departing Perimeter'
                  : 'Safe at Home'}
              </div>
              <div className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">
                {isOutsideGeofence ? 'Nagging alert active' : 'Monitoring departures'}
              </div>
            </div>
          </div>

          {/* Geofence radius controller */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-stone-600 dark:text-stone-400 font-medium">
              <span>Geofence Perimeter Radius</span>
              <span className="font-mono tabular-nums text-stone-900 dark:text-stone-100 font-semibold">{radius} meters</span>
            </div>
            <div className="flex items-center gap-2">
              {[50, 75, 100, 150, 250].map((r) => (
                <button
                  key={r}
                  onClick={() => onUpdateGeofence({ radiusMeters: r })}
                  className={`flex-1 py-1.5 text-xs font-mono rounded-lg transition-colors min-h-[38px] ${
                    radius === r
                      ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-semibold'
                      : 'bg-stone-200/80 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  {r}m
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Departure Simulator Controls */}
      <div className="bg-stone-50 dark:bg-stone-950/60 rounded-xl p-5 border border-stone-200 dark:border-stone-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              Interactive Departure Simulator
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Simulate leaving the house right from your browser to verify the nagging notification trigger.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onResetToHome}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 flex items-center gap-1.5 min-h-[40px] transition-colors"
              title="Reset location to home"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Return Home</span>
            </button>

            <button
              onClick={onTriggerSimulatedDeparture}
              disabled={isSimulating}
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 flex items-center gap-1.5 min-h-[40px] shadow-sm disabled:opacity-50 transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isSimulating ? 'Walking Away...' : 'Simulate Walking Out'}</span>
            </button>
          </div>
        </div>

        {/* Distance Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-stone-600 dark:text-stone-400 font-mono">
            <span>Home (0m)</span>
            <span className="font-semibold text-stone-900 dark:text-stone-100">Simulated Distance: {Math.round(currentDistance)}m</span>
            <span>Far Away (300m)</span>
          </div>
          <input
            type="range"
            min="0"
            max="300"
            step="5"
            value={Math.round(currentDistance)}
            onChange={(e) => onUpdateDistance(Number(e.target.value))}
            className="w-full h-2 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-stone-900 dark:accent-stone-100"
          />
        </div>

        {/* Quick Location Waypoints */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() => onUpdateDistance(0)}
            className="px-2.5 py-1 text-xs rounded-md bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300"
          >
            Living Room (0m)
          </button>
          <button
            onClick={() => onUpdateDistance(15)}
            className="px-2.5 py-1 text-xs rounded-md bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300"
          >
            Front Porch (15m)
          </button>
          <button
            onClick={() => onUpdateDistance(45)}
            className="px-2.5 py-1 text-xs rounded-md bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300"
          >
            Driveway (45m)
          </button>
          <button
            onClick={() => onUpdateDistance(radius + 15)}
            className="px-2.5 py-1 text-xs rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-800 dark:text-rose-300 font-medium"
          >
            Beyond Perimeter ({radius + 15}m - Trigger Nag)
          </button>
          <button
            onClick={() => onUpdateDistance(250)}
            className="px-2.5 py-1 text-xs rounded-md bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-300"
          >
            End of Block (250m)
          </button>
        </div>
      </div>

      {/* Home Location Setup */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-stone-500 dark:text-stone-400">
        <div>
          <span className="font-semibold text-stone-700 dark:text-stone-300">Configured Home:</span>{' '}
          <span className="font-mono text-stone-900 dark:text-stone-100">
            {geofence.homeLatitude.toFixed(4)}, {geofence.homeLongitude.toFixed(4)}
          </span>{' '}
          ({geofence.homeAddress || 'Maplewood Residence'})
        </div>

        <button
          onClick={handleGetCurrentGps}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 flex items-center gap-1.5 min-h-[40px] shrink-0 transition-colors"
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Set Current GPS as Home</span>
        </button>
      </div>
    </div>
  );
};
