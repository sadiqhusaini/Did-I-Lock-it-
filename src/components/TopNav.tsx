import React from 'react';
import { ShieldCheck, Sun, Moon } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton.js';

interface TopNavProps {
  activeTab: 'checklist' | 'sync' | 'geofence' | 'activity';
  setActiveTab: (tab: 'checklist' | 'sync' | 'geofence' | 'activity') => void;
  householdName: string;
  householdCode: string;
  currentMemberName: string;
  totalItems: number;
  checkedItems: number;
  syncStatus: 'connected' | 'reconnecting' | 'offline';
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onQuickDeparture: () => void;
  onOpenSwitchMember: () => void;
  onManualSync: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  householdName,
  householdCode,
  currentMemberName,
  totalItems,
  checkedItems,
  syncStatus,
  isDarkMode,
  onToggleDarkMode,
  onQuickDeparture,
  onOpenSwitchMember,
  onManualSync,
}) => {
  const isAllChecked = totalItems > 0 && checkedItems === totalItems;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('checklist')}
              className="text-lg sm:text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100 hover:text-stone-700 dark:hover:text-stone-300 transition-colors whitespace-nowrap text-left cursor-pointer"
            >
              Did I Lock It?
            </button>
          </div>

          {/* Zone 2: 4 clean text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600 dark:text-stone-400">
            <button
              onClick={() => setActiveTab('checklist')}
              className={`hover:text-stone-900 dark:hover:text-stone-100 transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer ${
                activeTab === 'checklist'
                  ? 'text-stone-900 dark:text-stone-100 font-semibold border-b-2 border-stone-900 dark:border-stone-100'
                  : ''
              }`}
            >
              Checklist ({checkedItems}/{totalItems})
            </button>
            <button
              onClick={() => setActiveTab('sync')}
              className={`hover:text-stone-900 dark:hover:text-stone-100 transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer ${
                activeTab === 'sync'
                  ? 'text-stone-900 dark:text-stone-100 font-semibold border-b-2 border-stone-900 dark:border-stone-100'
                  : ''
              }`}
            >
              Household Sync
            </button>
            <button
              onClick={() => setActiveTab('geofence')}
              className={`hover:text-stone-900 dark:hover:text-stone-100 transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer ${
                activeTab === 'geofence'
                  ? 'text-stone-900 dark:text-stone-100 font-semibold border-b-2 border-stone-900 dark:border-stone-100'
                  : ''
              }`}
            >
              Departure Geofence
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`hover:text-stone-900 dark:hover:text-stone-100 transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer ${
                activeTab === 'activity'
                  ? 'text-stone-900 dark:text-stone-100 font-semibold border-b-2 border-stone-900 dark:border-stone-100'
                  : ''
              }`}
            >
              Activity Log
            </button>
          </nav>

          {/* Zone 3: Member Switcher + Install + Dark Mode + Primary Action */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Active Member & Sync indicator chip */}
            <button
              onClick={onOpenSwitchMember}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-800 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer min-h-[40px]"
              title={`Active member: ${currentMemberName} (${householdCode}). Click to switch.`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  syncStatus === 'connected'
                    ? 'bg-emerald-500'
                    : syncStatus === 'reconnecting'
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-rose-500'
                }`}
              />
              <span className="font-medium truncate max-w-[110px]">{currentMemberName}</span>
            </button>

            {/* In-App PWA Install Button */}
            <div className="hidden lg:block">
              <PWAInstallButton />
            </div>

            {/* Global Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-stone-600" />
              )}
            </button>

            {/* Primary Action Button */}
            <button
              onClick={onQuickDeparture}
              className={`px-3.5 sm:px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-150 whitespace-nowrap shrink-0 flex items-center gap-1.5 sm:gap-2 shadow-xs min-h-[40px] cursor-pointer ${
                isAllChecked
                  ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                  : 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isAllChecked ? 'Safe to Leave' : 'Leaving Now'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
